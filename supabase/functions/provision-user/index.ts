import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * provision-user: Admin-only edge function to create a new student account.
 * Uses service role key to bypass RLS and create auth user + profile.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: { user: caller }, error: callerError } = await supabaseAdmin.auth.getUser(token);
    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: callerProfile } = await supabaseAdmin
      .from("user_profiles")
      .select("role")
      .eq("id", caller.id)
      .single();
    if (callerProfile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden: Admins only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    // ── Create single student ────────────────────────────────────────────────
    if (action === "create_student") {
      const { studentId, fullName, email, mobile, department, year, role, avatarUrl } = body;

      if (!studentId || !fullName || !email) {
        return new Response(JSON.stringify({ error: "studentId, fullName, email are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check for duplicate student ID
      const { data: existing } = await supabaseAdmin
        .from("user_profiles")
        .select("id")
        .eq("student_id", studentId)
        .single();
      if (existing) {
        return new Response(JSON.stringify({ error: `Student ID ${studentId} already exists` }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate a setup token (random UUID used as one-time token)
      const setupToken = crypto.randomUUID();
      const setupTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Create auth user with a random temporary password
      const tempPassword = crypto.randomUUID();
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          username: studentId.toLowerCase(),
        },
      });
      if (authError) {
        return new Response(JSON.stringify({ error: `Auth.createUser: ${authError.message}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = authData.user.id;

      // Upsert profile
      const { error: profileError } = await supabaseAdmin.from("user_profiles").upsert({
        id: userId,
        email,
        username: studentId.toLowerCase(),
        full_name: fullName,
        avatar_url: avatarUrl ?? null,
        department: department ?? "General",
        year: year ?? "1st Year",
        mobile: mobile ?? null,
        student_id: studentId,
        role: role ?? "student",
        status: "active",
        is_verified: false,
        trust_score: 75,
        first_login_completed: false,
        setup_token: setupToken,
        setup_token_expires_at: setupTokenExpiry.toISOString(),
        created_at: new Date().toISOString(),
      });
      if (profileError) {
        // Rollback auth user
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return new Response(JSON.stringify({ error: `Profile.upsert: ${profileError.message}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Send welcome notification
      await supabaseAdmin.from("notifications").insert({
        user_id: userId,
        title: "Welcome to Campus Circular!",
        message: `Your account has been created. Student ID: ${studentId}. Complete your setup using the link sent to ${email}.`,
        type: "info",
        link: "/setup",
      });

      // Build simulated email and SMS content
      const origin = req.headers.get("origin") ?? "https://campuscircular.edu";
      const setupLink = `${origin}/setup?token=${setupToken}`;

      const emailContent = `Subject: Welcome to Campus Circular — Complete Your Account Setup

Dear ${fullName},

Your college account has been created on Campus Circular, your campus resource sharing platform.

Student ID: ${studentId}
College Email: ${email}

Complete your account setup using the link below:

${setupLink}

This setup link is valid for 7 days. After clicking the link, you will be asked to create a secure password.

If you did not expect this email, please contact support@campuscircular.edu.

Best regards,
Campus Circular Team`;

      const smsContent = `Campus Circular: Your college account is ready. Student ID: ${studentId}. Complete your account setup: ${setupLink} (Valid 7 days)`;

      return new Response(
        JSON.stringify({
          success: true,
          userId,
          studentId,
          setupToken,
          setupLink,
          emailContent,
          smsContent,
          email,
          mobile: mobile ?? null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Bulk create students (CSV import) ────────────────────────────────────
    if (action === "bulk_create") {
      const { students } = body; // Array of { studentId, fullName, email, mobile, department, year }
      if (!Array.isArray(students) || students.length === 0) {
        return new Response(JSON.stringify({ error: "students array required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const results = [];
      const errors = [];

      for (const s of students) {
        try {
          const setupToken = crypto.randomUUID();
          const setupTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          const tempPassword = crypto.randomUUID();

          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: s.email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { full_name: s.fullName, username: s.studentId?.toLowerCase() },
          });
          if (authError) { errors.push({ studentId: s.studentId, error: authError.message }); continue; }

          await supabaseAdmin.from("user_profiles").upsert({
            id: authData.user.id,
            email: s.email,
            username: s.studentId?.toLowerCase(),
            full_name: s.fullName,
            department: s.department ?? "General",
            year: s.year ?? "1st Year",
            mobile: s.mobile ?? null,
            student_id: s.studentId,
            role: "student",
            status: "active",
            is_verified: false,
            trust_score: 75,
            first_login_completed: false,
            setup_token: setupToken,
            setup_token_expires_at: setupTokenExpiry.toISOString(),
            created_at: new Date().toISOString(),
          });

          const origin = req.headers.get("origin") ?? "https://campuscircular.edu";
          const setupLink = `${origin}/setup?token=${setupToken}`;

          results.push({
            studentId: s.studentId,
            email: s.email,
            setupToken,
            setupLink,
            emailContent: `Campus Circular: Account created for ${s.fullName}. Student ID: ${s.studentId}. Setup: ${setupLink}`,
            smsContent: `Campus Circular: Your account is ready. Student ID: ${s.studentId}. Setup: ${setupLink}`,
          });
        } catch (e: any) {
          errors.push({ studentId: s.studentId, error: e.message });
        }
      }

      return new Response(
        JSON.stringify({ success: true, created: results.length, errors, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Regenerate setup token ────────────────────────────────────────────────
    if (action === "regenerate_token") {
      const { userId } = body;
      const setupToken = crypto.randomUUID();
      const setupTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await supabaseAdmin.from("user_profiles").update({
        setup_token: setupToken,
        setup_token_expires_at: setupTokenExpiry.toISOString(),
        first_login_completed: false,
      }).eq("id", userId);

      const { data: profile } = await supabaseAdmin
        .from("user_profiles")
        .select("email, student_id")
        .eq("id", userId)
        .single();

      const origin = req.headers.get("origin") ?? "https://campuscircular.edu";
      const setupLink = `${origin}/setup?token=${setupToken}`;

      return new Response(
        JSON.stringify({ success: true, setupToken, setupLink, email: profile?.email }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Verify setup token (used by setup page) ──────────────────────────────
    if (action === "verify_setup_token") {
      const { token } = body;
      const { data: profile, error } = await supabaseAdmin
        .from("user_profiles")
        .select("id, email, student_id, full_name, setup_token_expires_at, first_login_completed")
        .eq("setup_token", token)
        .single();

      if (error || !profile) {
        return new Response(JSON.stringify({ error: "Invalid setup link" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (new Date(profile.setup_token_expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: "Setup link has expired. Contact admin for a new link." }), {
          status: 410,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (profile.first_login_completed) {
        return new Response(JSON.stringify({ error: "This setup link has already been used. Please log in normally." }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ valid: true, userId: profile.id, email: profile.email, studentId: profile.student_id, fullName: profile.full_name }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Complete account setup (set password) ────────────────────────────────
    if (action === "complete_setup") {
      const { token, newPassword } = body;
      const { data: profile, error } = await supabaseAdmin
        .from("user_profiles")
        .select("id, email, setup_token_expires_at, first_login_completed")
        .eq("setup_token", token)
        .single();

      if (error || !profile) {
        return new Response(JSON.stringify({ error: "Invalid setup link" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (new Date(profile.setup_token_expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: "Setup link expired" }), {
          status: 410,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (profile.first_login_completed) {
        return new Response(JSON.stringify({ error: "Setup already completed. Please log in." }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Set user's password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
        password: newPassword,
      });
      if (updateError) {
        return new Response(JSON.stringify({ error: `Password.update: ${updateError.message}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Mark setup complete, clear token
      await supabaseAdmin.from("user_profiles").update({
        first_login_completed: true,
        setup_token: null,
        setup_token_expires_at: null,
        last_login: new Date().toISOString(),
      }).eq("id", profile.id);

      // Sign in the user to return a session
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: profile.email,
        password: newPassword,
      });
      if (signInError) {
        return new Response(JSON.stringify({ error: `SignIn: ${signInError.message}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ success: true, session: signInData.session }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("provision-user error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
