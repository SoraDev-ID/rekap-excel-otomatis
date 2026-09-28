import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak terautentikasi.' }, { status: 401 });
    }

    // Get current user profile
    const { data: profile } = await supabase
      .from('users_profile')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Hanya admin yang dapat mengelola pengguna.' }, { status: 403 });
    }

    // Fetch all profiles in tenant
    const { data: users, error: listError } = await supabase
      .from('users_profile')
      .select('id, full_name, role, created_at')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: true });

    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }

    // Fetch emails from auth via admin client
    const adminSupabase = getAdminClient();
    const { data: authUsers } = await adminSupabase.auth.admin.listUsers();
    const emailMap = new Map(authUsers?.users?.map((u) => [u.id, u.email]) || []);

    const enriched = users.map((u) => ({
      ...u,
      email: emailMap.get(u.id) || 'Tidak tersedia',
    }));

    return NextResponse.json({ users: enriched });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak terautentikasi.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users_profile')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const body = await req.json();
    const { email, password, fullName, role = 'staff' } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Email, password, dan nama lengkap wajib diisi.' }, { status: 400 });
    }

    if (!['admin', 'staff', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Role tidak valid.' }, { status: 400 });
    }

    const adminSupabase = getAdminClient();

    // Create user in Auth
    const { data: createdAuth, error: createAuthError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createAuthError) {
      return NextResponse.json({ error: `Gagal membuat akun auth: ${createAuthError.message}` }, { status: 400 });
    }

    // Insert into users_profile
    const { error: profileError } = await adminSupabase
      .from('users_profile')
      .insert({
        id: createdAuth.user.id,
        tenant_id: profile.tenant_id,
        full_name: fullName,
        role,
      });

    if (profileError) {
      return NextResponse.json({ error: `Gagal menyimpan profil: ${profileError.message}` }, { status: 500 });
    }

    // Log activity
    await supabase.from('activity_log').insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      action: 'ADD_USER',
      detail: { created_email: email, role, full_name: fullName },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: createdAuth.user.id,
        email,
        full_name: fullName,
        role,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak terautentikasi.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users_profile')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: 'Parameter userId dan role diperlukan.' }, { status: 400 });
    }

    if (!['admin', 'staff', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Role tidak valid.' }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('users_profile')
      .update({ role })
      .eq('id', userId)
      .eq('tenant_id', profile.tenant_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Log activity
    await supabase.from('activity_log').insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      action: 'UPDATE_ROLE',
      detail: { target_user_id: userId, new_role: role },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak terautentikasi.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users_profile')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'Parameter id pengguna diperlukan.' }, { status: 400 });
    }

    if (userId === user.id) {
      return NextResponse.json({ error: 'Anda tidak dapat menghapus akun Anda sendiri.' }, { status: 400 });
    }

    // Delete user from auth (cascades to users_profile)
    const adminSupabase = getAdminClient();
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Log activity
    await supabase.from('activity_log').insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      action: 'DELETE_USER',
      detail: { target_user_id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
