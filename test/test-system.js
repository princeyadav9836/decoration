const http = require('http');
const path = require('path');
const fs = require('fs');

// Ensure test environment variables
process.env.NETLIFY = 'true';
process.env.PORT = '4007';

const app = require('../server.js');
const server = http.createServer(app);

server.listen(4007, '127.0.0.1', async () => {
  console.log('\n======================================================');
  console.log('🧪 YUVI DECORATION / THE PARTY HARD - FULL TEST SUITE');
  console.log('======================================================\n');
  const baseUrl = 'http://127.0.0.1:4007';

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // 1. Health & DB Status
  await test('1. Health Check Endpoint (/api/health)', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error(`Unexpected status: ${data.status}`);
  });

  await test('2. Database Status Endpoint (/api/db-status)', async () => {
    const res = await fetch(`${baseUrl}/api/db-status`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.type) throw new Error('Missing database type');
  });

  // 2. Services
  await test('3. Fetch All 60+ Services (/api/services)', async () => {
    const res = await fetch(`${baseUrl}/api/services`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length < 50) {
      throw new Error(`Expected at least 50 services, got ${Array.isArray(data) ? data.length : 'non-array'}`);
    }
  });

  await test('4. Filter Services by Category (/api/services?category=birthday)', async () => {
    const res = await fetch(`${baseUrl}/api/services?category=birthday`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error('No birthday services found');
    const allBirthday = data.every(s => s.category.toLowerCase() === 'birthday');
    if (!allBirthday) throw new Error('Found non-birthday items in filtered response');
  });

  await test('5. Fetch Single Service by ID (/api/services/srv-bday-1)', async () => {
    const res = await fetch(`${baseUrl}/api/services/srv-bday-1`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.id !== 'srv-bday-1') throw new Error(`Expected srv-bday-1, got ${data.id}`);
  });

  // 3. Contact & Enquiry
  await test('6. Customer Enquiry Submission (/api/contact)', async () => {
    const res = await fetch(`${baseUrl}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Verification User',
        phone: '9876543210',
        message: 'Looking for a baby shower pastel balloon decor in Patna'
      })
    });
    if (res.status !== 200 && res.status !== 201) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed');
  });

  // 4. Bilingual AI Chat Concierge
  await test('7. Bilingual AI Concierge Query (/api/chat)', async () => {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'birthday decoration under 3000 in boring road' })
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.reply || typeof data.reply !== 'string') throw new Error('No reply text');
  });

  // 5. Coupons
  await test('8. Active Coupons List (/api/coupons)', async () => {
    const res = await fetch(`${baseUrl}/api/coupons`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error('No coupons returned');
  });

  await test('9. Apply Coupon Code (/api/coupons/apply)', async () => {
    const res = await fetch(`${baseUrl}/api/coupons/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'WELCOME10', amount: 3000 })
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || data.discountAmount <= 0) throw new Error('Coupon calculation failed');
  });

  // 6. Service Areas & Pincodes
  await test('10. Service Areas & Pincode Check (/api/check-pincode)', async () => {
    const res = await fetch(`${baseUrl}/api/check-pincode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pincode: '800001' })
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.serviceable) throw new Error('Pincode 800001 should be serviceable');
  });

  // 7. Dynamic Estimate Builder
  await test('11. Dynamic Design Estimate (/api/builder/estimate)', async () => {
    const res = await fetch(`${baseUrl}/api/builder/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        archType: 'ring-arch',
        balloonCount: '300',
        neonSign: 'hbd',
        extraPedestals: 2
      })
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.estimatedAmount || data.estimatedAmount <= 0) throw new Error('Invalid estimate calculation');
  });

  // 8. Reviews
  await test('12. Customer Reviews List (/api/reviews)', async () => {
    const res = await fetch(`${baseUrl}/api/reviews`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error('No reviews returned');
  });

  // 9. Booking Creation + PDF Receipt
  let createdBookingId = null;
  await test('13. Create Real Booking & Auto-Generate Luxury PDF Receipt', async () => {
    const bookingPayload = {
      customerName: 'Aarav Kumar',
      mobile: '9876501234',
      email: 'aarav.kumar@example.com',
      eventType: 'Birthday Party',
      packageId: 'srv-bday-1',
      packageName: 'Pastel Dream Birthday Ring Arch',
      eventDate: '2026-12-15',
      eventTime: 'Evening (5:00 PM - 8:00 PM)',
      venueAddress: 'Flat 402, Royal Residency, Boring Road, Patna',
      amount: 2499,
      notes: 'Need LED Happy Birthday neon sign with 5th age number'
    };
    const res = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingPayload)
    });
    if (res.status !== 200 && res.status !== 201) {
      const err = await res.text();
      throw new Error(`Status ${res.status}: ${err}`);
    }
    const data = await res.json();
    if (!data.success || !data.booking || !data.booking.id) {
      throw new Error('Booking failed: ' + JSON.stringify(data));
    }
    createdBookingId = data.booking.id;

    // Verify PDF Receipt can be downloaded and has proper binary bytes
    const pdfRes = await fetch(`${baseUrl}/api/bookings/${createdBookingId}/receipt.pdf`);
    if (pdfRes.status !== 200) throw new Error(`PDF endpoint returned status ${pdfRes.status}`);
    const cType = pdfRes.headers.get('content-type') || '';
    if (!cType.includes('application/pdf')) throw new Error(`Expected application/pdf, got ${cType}`);
    const pdfBuffer = await pdfRes.arrayBuffer();
    if (pdfBuffer.byteLength < 500) throw new Error(`PDF corrupted or too small (${pdfBuffer.byteLength} bytes)`);
  });

  // 10. Track Booking
  await test('14. Live Order & Booking Tracker (/api/bookings/track/:query)', async () => {
    if (!createdBookingId) throw new Error('No booking id to track');
    const res = await fetch(`${baseUrl}/api/bookings/track/${createdBookingId}`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0 || data[0].id !== createdBookingId) {
      throw new Error('Tracker returned incorrect booking data');
    }
  });

  // 11. Admin Authentication
  let adminToken = '';
  await test('15. Admin Login with Credentials (/api/admin/login)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'yuvi@2026' })
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.token) throw new Error('Admin login failed');
    adminToken = data.token;
  });

  // 12. Admin Protected Endpoints
  await test('16. Admin Fetch Bookings & Stats (/api/admin/bookings)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/bookings`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.bookings) || !data.stats) throw new Error('Invalid bookings/stats payload');
  });

  await test('17. Admin Analytics Dashboard (/api/admin/analytics)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/analytics`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.monthlyRevenue && !data.stats) throw new Error('Missing analytics data');
  });

  await test('18. Admin Inventory Management (/api/admin/inventory)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/inventory`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) throw new Error('No inventory returned');
  });

  await test('19. Admin Staff Team Management (/api/admin/staff)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/staff`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.staff || !Array.isArray(data.staff) || data.staff.length === 0) throw new Error('No staff returned');
  });

  await test('20. Admin Customer Ledger (/api/admin/customers)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/customers`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.customers || !Array.isArray(data.customers)) throw new Error('Customers should be an array');
  });

  // Clean up created test booking
  if (createdBookingId) {
    await test('21. Clean Up Test Booking (/api/admin/bookings/:id)', async () => {
      const res = await fetch(`${baseUrl}/api/admin/bookings/${createdBookingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
    });
  }

  // 13. Frontend HTML Page Deliveries
  const pages = [
    { path: '/', name: 'Home Landing Page' },
    { path: '/book', name: 'Dedicated Booking Page' },
    { path: '/category', name: 'Category Occasion Hub' },
    { path: '/birthday', name: 'Birthday Shortcut Redirect' },
    { path: '/admin.html', name: 'Admin Dashboard' }
  ];

  for (const page of pages) {
    await test(`22. Frontend Route: ${page.name} (${page.path})`, async () => {
      const res = await fetch(`${baseUrl}${page.path}`);
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const html = await res.text();
      if (!html.includes('<!DOCTYPE html>') && !html.includes('<html')) {
        throw new Error('Response is not valid HTML document');
      }
    });
  }

  console.log('\n======================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  server.close(() => {
    process.exit(failed > 0 ? 1 : 0);
  });
});
