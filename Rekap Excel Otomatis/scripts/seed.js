const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables.');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seed() {
  console.log('--- Starting Database Seeding ---');

  // 1. Create or Find Demo Tenant
  let tenantId;
  const { data: existingTenants, error: tenantSearchError } = await supabaseAdmin
    .from('tenants')
    .select('id, name')
    .eq('name', 'PT Nusantara Demo Corp')
    .limit(1);

  if (tenantSearchError) {
    console.error('Error searching tenant:', tenantSearchError);
  }

  if (existingTenants && existingTenants.length > 0) {
    tenantId = existingTenants[0].id;
    console.log('Using existing tenant:', tenantId);
  } else {
    const { data: newTenant, error: createTenantError } = await supabaseAdmin
      .from('tenants')
      .insert({ name: 'PT Nusantara Demo Corp' })
      .select()
      .single();

    if (createTenantError) {
      console.error('Failed to create tenant:', createTenantError);
      process.exit(1);
    }
    tenantId = newTenant.id;
    console.log('Created new tenant:', tenantId);
  }

  // 2. Demo Users Configuration
  const demoUsers = [
    {
      email: 'admin@demo.com',
      password: 'Password123!',
      fullName: 'Ahmad Dahlan (Admin)',
      role: 'admin'
    },
    {
      email: 'staff1@demo.com',
      password: 'Password123!',
      fullName: 'Siti Rahma (Staff Keuangan)',
      role: 'staff'
    },
    {
      email: 'staff2@demo.com',
      password: 'Password123!',
      fullName: 'Budi Pratama (Staff Operasional)',
      role: 'staff'
    }
  ];

  const userIds = {};

  for (const u of demoUsers) {
    // Check if user exists in auth
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    let authUser = listData?.users?.find(x => x.email === u.email);

    if (!authUser) {
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.fullName }
      });
      if (createError) {
        console.error(`Failed to create auth user ${u.email}:`, createError);
        continue;
      }
      authUser = created.user;
      console.log(`Created auth user ${u.email} (${authUser.id})`);
    } else {
      console.log(`Auth user ${u.email} already exists (${authUser.id})`);
      // Update password to ensure it's Password123!
      await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        password: u.password,
        email_confirm: true
      });
    }

    userIds[u.email] = authUser.id;

    // Upsert into users_profile
    const { error: profileError } = await supabaseAdmin
      .from('users_profile')
      .upsert({
        id: authUser.id,
        tenant_id: tenantId,
        full_name: u.fullName,
        role: u.role
      });

    if (profileError) {
      console.error(`Error saving profile for ${u.email}:`, profileError);
    } else {
      console.log(`Saved profile for ${u.email} as ${u.role}`);
    }
  }

  // 3. Create Sample Excel Files
  const samplesDir = path.join(__dirname, '../public/samples');
  if (!fs.existsSync(samplesDir)) {
    fs.mkdirSync(samplesDir, { recursive: true });
  }

  // Sample 1: Sales Data
  const salesData = [
    { No: 1, Tanggal: '2026-01-05', Wilayah: 'Jakarta', Kategori: 'Elektronik', Produk: 'Laptop Pro 14', Jumlah: 12, Harga_Satuan: 14500000, Total_Penjualan: 174000000 },
    { No: 2, Tanggal: '2026-01-08', Wilayah: 'Surabaya', Kategori: 'Elektronik', Produk: 'Monitor 4K 27"', Jumlah: 25, Harga_Satuan: 4200000, Total_Penjualan: 105000000 },
    { No: 3, Tanggal: '2026-01-12', Wilayah: 'Bandung', Kategori: 'Furniture', Produk: 'Meja Kerja Ergonomis', Jumlah: 18, Harga_Satuan: 2800000, Total_Penjualan: 50400000 },
    { No: 4, Tanggal: '2026-01-15', Wilayah: 'Medan', Kategori: 'ATK', Produk: 'Kertas A4 Rim (Dus)', Jumlah: 80, Harga_Satuan: 250000, Total_Penjualan: 20000000 },
    { No: 5, Tanggal: '2026-01-20', Wilayah: 'Jakarta', Kategori: 'Elektronik', Produk: 'Mouse Wireless', Jumlah: 65, Harga_Satuan: 350000, Total_Penjualan: 22750000 },
    { No: 6, Tanggal: '2026-01-24', Wilayah: 'Semarang', Kategori: 'Furniture', Produk: 'Kursi Ergonomis Mesh', Jumlah: 30, Harga_Satuan: 1950000, Total_Penjualan: 58500000 },
    { No: 7, Tanggal: '2026-02-02', Wilayah: 'Surabaya', Kategori: 'Elektronik', Produk: 'Keyboard Mekanikal', Jumlah: 40, Harga_Satuan: 850000, Total_Penjualan: 34000000 },
    { No: 8, Tanggal: '2026-02-10', Wilayah: 'Jakarta', Kategori: 'Furniture', Produk: 'Lemari Arsip Baja', Jumlah: 10, Harga_Satuan: 3200000, Total_Penjualan: 32000000 },
    { No: 9, Tanggal: '2026-02-18', Wilayah: 'Bandung', Kategori: 'Elektronik', Produk: 'Laptop Pro 14', Jumlah: 8, Harga_Satuan: 14500000, Total_Penjualan: 116000000 },
    { No: 10, Tanggal: '2026-02-25', Wilayah: 'Medan', Kategori: 'Furniture', Produk: 'Kursi Ergonomis Mesh', Jumlah: 15, Harga_Satuan: 1950000, Total_Penjualan: 29250000 },
    { No: 11, Tanggal: '2026-03-03', Wilayah: 'Surabaya', Kategori: 'ATK', Produk: 'Toner Printer Laser', Jumlah: 35, Harga_Satuan: 750000, Total_Penjualan: 26250000 },
    { No: 12, Tanggal: '2026-03-12', Wilayah: 'Jakarta', Kategori: 'Elektronik', Produk: 'Monitor 4K 27"', Jumlah: 20, Harga_Satuan: 4200000, Total_Penjualan: 84000000 }
  ];

  const salesWb = XLSX.utils.book_new();
  const salesWs = XLSX.utils.json_to_sheet(salesData);
  XLSX.utils.book_append_sheet(salesWb, salesWs, 'Penjualan_Q1');
  const salesBuffer = XLSX.write(salesWb, { type: 'buffer', bookType: 'xlsx' });
  const salesFileName = 'Laporan_Penjualan_Q1_2026.xlsx';
  fs.writeFileSync(path.join(samplesDir, salesFileName), salesBuffer);

  // Sample 2: Operational Expense Data
  const expenseData = [
    { ID: 'EXP-001', Tanggal: '2026-01-04', Departemen: 'IT & Infrastruktur', Deskripsi: 'Cloud Hosting & Security', Biaya: 45000000, Disetujui_Oleh: 'CTO' },
    { ID: 'EXP-002', Tanggal: '2026-01-10', Departemen: 'Operasional', Deskripsi: 'Sewa Gedung Kantor Q1', Biaya: 120000000, Disetujui_Oleh: 'COO' },
    { ID: 'EXP-003', Tanggal: '2026-01-15', Departemen: 'Pemasaran', Deskripsi: 'Digital Advertising Kampanye', Biaya: 35000000, Disetujui_Oleh: 'CMO' },
    { ID: 'EXP-004', Tanggal: '2026-01-22', Departemen: 'SDM', Deskripsi: 'Pelatihan Sertifikasi Tim', Biaya: 18500000, Disetujui_Oleh: 'HR Director' },
    { ID: 'EXP-005', Tanggal: '2026-02-05', Departemen: 'IT & Infrastruktur', Deskripsi: 'Lisensi Software Produktivitas', Biaya: 28000000, Disetujui_Oleh: 'CTO' },
    { ID: 'EXP-006', Tanggal: '2026-02-14', Departemen: 'Operasional', Deskripsi: 'Logistik & Ekspedisi', Biaya: 22400000, Disetujui_Oleh: 'COO' },
    { ID: 'EXP-007', Tanggal: '2026-02-28', Departemen: 'Pemasaran', Deskripsi: 'Event Expo Industri', Biaya: 65000000, Disetujui_Oleh: 'CMO' },
    { ID: 'EXP-008', Tanggal: '2026-03-05', Departemen: 'SDM', Deskripsi: 'Medical Check-Up Tahunan', Biaya: 42000000, Disetujui_Oleh: 'HR Director' },
    { ID: 'EXP-009', Tanggal: '2026-03-15', Departemen: 'Operasional', Deskripsi: 'Pemeliharaan Fasilitas Gedung', Biaya: 15500000, Disetujui_Oleh: 'COO' }
  ];

  const expenseWb = XLSX.utils.book_new();
  const expenseWs = XLSX.utils.json_to_sheet(expenseData);
  XLSX.utils.book_append_sheet(expenseWb, expenseWs, 'Pengeluaran');
  const expenseBuffer = XLSX.write(expenseWb, { type: 'buffer', bookType: 'xlsx' });
  const expenseFileName = 'Laporan_Pengeluaran_2026.xlsx';
  fs.writeFileSync(path.join(samplesDir, expenseFileName), expenseBuffer);

  // 4. Upload Files to Supabase Storage and Insert to uploaded_files
  const storagePathSales = `${tenantId}/${Date.now()}_${salesFileName}`;
  const { error: uploadSalesError } = await supabaseAdmin.storage
    .from('excel-files')
    .upload(storagePathSales, salesBuffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      upsert: true
    });

  if (uploadSalesError) {
    console.error('Failed to upload sales excel to storage:', uploadSalesError);
  } else {
    console.log('Uploaded sales file to storage:', storagePathSales);
  }

  // Insert sales file record
  const { data: salesFileRecord, error: fileInsertError } = await supabaseAdmin
    .from('uploaded_files')
    .insert({
      tenant_id: tenantId,
      uploaded_by: userIds['staff1@demo.com'],
      file_name: salesFileName,
      storage_path: storagePathSales,
      file_size: salesBuffer.length,
      mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      status: 'done'
    })
    .select()
    .single();

  if (fileInsertError) {
    console.error('Failed to insert sales file record:', fileInsertError);
  } else {
    console.log('Inserted sales file record:', salesFileRecord.id);

    // 5. Insert Recap for Sales
    const salesSummary = {
      recapTitle: 'Rekap Penjualan Q1 2026 per Wilayah & Kategori',
      groupByColumn: 'Wilayah',
      metricColumn: 'Total_Penjualan',
      aggregation: 'sum',
      totalRecords: salesData.length,
      overallSum: salesData.reduce((acc, curr) => acc + curr.Total_Penjualan, 0),
      overallAverage: Math.round(salesData.reduce((acc, curr) => acc + curr.Total_Penjualan, 0) / salesData.length),
      aggregations: [
        { group: 'Jakarta', count: 4, sum: 312750000, average: 78187500, min: 22750000, max: 174000000 },
        { group: 'Surabaya', count: 3, sum: 165250000, average: 55083333, min: 26250000, max: 105000000 },
        { group: 'Bandung', count: 2, sum: 166400000, average: 83200000, min: 50400000, max: 116000000 },
        { group: 'Semarang', count: 1, sum: 58500000, average: 58500000, min: 58500000, max: 58500000 },
        { group: 'Medan', count: 2, sum: 49250000, average: 24625000, min: 20000000, max: 29250000 }
      ],
      breakdownByCategory: [
        { category: 'Elektronik', total: 535750000, count: 6 },
        { category: 'Furniture', total: 170150000, count: 4 },
        { category: 'ATK', total: 46250000, count: 2 }
      ],
      columns: Object.keys(salesData[0]),
      sampleRows: salesData.slice(0, 10)
    };

    const { data: recapRecord, error: recapError } = await supabaseAdmin
      .from('recap_results')
      .insert({
        tenant_id: tenantId,
        file_id: salesFileRecord.id,
        summary_data: salesSummary
      })
      .select()
      .single();

    if (recapError) {
      console.error('Failed to insert recap record:', recapError);
    } else {
      console.log('Inserted sales recap record:', recapRecord.id);
    }

    // Insert Activity Log
    await supabaseAdmin.from('activity_log').insert([
      {
        tenant_id: tenantId,
        user_id: userIds['staff1@demo.com'],
        action: 'UPLOAD_FILE',
        detail: { file_name: salesFileName, file_size: salesBuffer.length }
      },
      {
        tenant_id: tenantId,
        user_id: userIds['staff1@demo.com'],
        action: 'GENERATE_RECAP',
        detail: { file_id: salesFileRecord.id, group_by: 'Wilayah', metric: 'Total_Penjualan' }
      }
    ]);
  }

  // Upload Expense File
  const storagePathExpense = `${tenantId}/${Date.now()}_${expenseFileName}`;
  await supabaseAdmin.storage
    .from('excel-files')
    .upload(storagePathExpense, expenseBuffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      upsert: true
    });

  const { data: expenseFileRecord } = await supabaseAdmin
    .from('uploaded_files')
    .insert({
      tenant_id: tenantId,
      uploaded_by: userIds['staff2@demo.com'],
      file_name: expenseFileName,
      storage_path: storagePathExpense,
      file_size: expenseBuffer.length,
      mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      status: 'done'
    })
    .select()
    .single();

  if (expenseFileRecord) {
    const expenseSummary = {
      recapTitle: 'Rekap Biaya Operasional 2026 per Departemen',
      groupByColumn: 'Departemen',
      metricColumn: 'Biaya',
      aggregation: 'sum',
      totalRecords: expenseData.length,
      overallSum: expenseData.reduce((acc, curr) => acc + curr.Biaya, 0),
      overallAverage: Math.round(expenseData.reduce((acc, curr) => acc + curr.Biaya, 0) / expenseData.length),
      aggregations: [
        { group: 'Operasional', count: 3, sum: 157900000, average: 52633333, min: 15500000, max: 120000000 },
        { group: 'Pemasaran', count: 2, sum: 100000000, average: 50000000, min: 35000000, max: 65000000 },
        { group: 'IT & Infrastruktur', count: 2, sum: 73000000, average: 36500000, min: 28000000, max: 45000000 },
        { group: 'SDM', count: 2, sum: 60500000, average: 30250000, min: 18500000, max: 42000000 }
      ],
      columns: Object.keys(expenseData[0]),
      sampleRows: expenseData.slice(0, 10)
    };

    await supabaseAdmin
      .from('recap_results')
      .insert({
        tenant_id: tenantId,
        file_id: expenseFileRecord.id,
        summary_data: expenseSummary
      });

    await supabaseAdmin.from('activity_log').insert([
      {
        tenant_id: tenantId,
        user_id: userIds['staff2@demo.com'],
        action: 'UPLOAD_FILE',
        detail: { file_name: expenseFileName, file_size: expenseBuffer.length }
      },
      {
        tenant_id: tenantId,
        user_id: userIds['staff2@demo.com'],
        action: 'GENERATE_RECAP',
        detail: { file_id: expenseFileRecord.id, group_by: 'Departemen', metric: 'Biaya' }
      }
    ]);
  }

  console.log('--- Database Seeding Completed Successfully ---');
}

seed().catch(err => {
  console.error('Seed script error:', err);
  process.exit(1);
});
