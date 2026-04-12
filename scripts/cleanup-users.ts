import pg from 'pg';
const { Pool } = pg;

const PROD_ADMIN_ID = 'cfbd8a1b-cee9-4633-a08f-92db76728de5';
const DEV_ADMIN_EMAIL = 'anita@zecoho.com';
const DEV_ADMIN_FIRST = 'Anita';
const DEV_ADMIN_LAST = 'Bhatt';
const DEV_ADMIN_HASH = '$2b$10$AkbAk2Hf9nTaBp9oLtmIFORRLncn4ecIPU47gG7dsx/7OgKxY8vL6';

async function safeDelete(client: pg.PoolClient, sql: string, params: string[], label: string) {
  const sp = `sp_${label.replace(/[^a-z0-9]/gi, '_')}`;
  try {
    await client.query(`SAVEPOINT ${sp}`);
    const r = await client.query(sql, params);
    await client.query(`RELEASE SAVEPOINT ${sp}`);
    if (r.rowCount && r.rowCount > 0) console.log(`  ${label}: ${r.rowCount} deleted/updated`);
  } catch (err: any) {
    await client.query(`ROLLBACK TO SAVEPOINT ${sp}`);
    if (err.code !== '42P01') { // 42P01 = relation does not exist
      console.warn(`  WARN ${label}:`, err.message);
    }
  }
}

async function cleanDatabase(pool: pg.Pool, adminId: string, label: string) {
  const client = await pool.connect();
  try {
    console.log(`\n========== ${label} ==========`);

    // Show what will be deleted
    try {
      const counts = await client.query(`
        SELECT
          (SELECT COUNT(*) FROM users WHERE id != $1) as users,
          (SELECT COUNT(*) FROM properties WHERE owner_id != $1) as properties,
          (SELECT COUNT(*) FROM bookings WHERE guest_id != $1) as bookings
      `, [adminId]);
      console.log('Will delete:', counts.rows[0]);
    } catch (_) {}

    await client.query('BEGIN');

    // 1. Messages
    await safeDelete(client, `
      DELETE FROM messages
      WHERE sender_id != $1
         OR conversation_id IN (
           SELECT id FROM conversations WHERE guest_id != $1 OR owner_id != $1
         )
    `, [adminId], 'messages');

    // 2. Notification logs
    await safeDelete(client, `DELETE FROM notification_logs WHERE user_id != $1`, [adminId], 'notification_logs');

    // 3. Push subscriptions
    await safeDelete(client, `DELETE FROM push_subscriptions WHERE user_id != $1`, [adminId], 'push_subscriptions');

    // 4. Notifications
    await safeDelete(client, `DELETE FROM notifications WHERE user_id != $1`, [adminId], 'notifications');

    // 5. Admin audit logs
    await safeDelete(client, `DELETE FROM admin_audit_logs WHERE admin_id != $1`, [adminId], 'admin_audit_logs');

    // 6. Support conversations
    await safeDelete(client, `
      DELETE FROM support_conversations WHERE user_id != $1
    `, [adminId], 'support_conversations');

    // 7. Support tickets
    await safeDelete(client, `
      DELETE FROM support_tickets WHERE assigned_to IS NULL OR assigned_to != $1
    `, [adminId], 'support_tickets');

    // 8. Contact interactions
    await safeDelete(client, `DELETE FROM contact_interactions WHERE actor_user_id != $1`, [adminId], 'contact_interactions');

    // 9. Chat logs
    await safeDelete(client, `DELETE FROM chat_logs WHERE owner_id != $1 OR guest_id != $1`, [adminId], 'chat_logs');

    // 10. Call logs
    await safeDelete(client, `DELETE FROM call_logs WHERE owner_id != $1 OR guest_id != $1`, [adminId], 'call_logs');

    // 11. Search history
    await safeDelete(client, `DELETE FROM search_history WHERE user_id != $1`, [adminId], 'search_history');

    // 12. User preferences
    await safeDelete(client, `DELETE FROM user_preferences WHERE user_id != $1`, [adminId], 'user_preferences');

    // 13. Wishlists
    await safeDelete(client, `DELETE FROM wishlists WHERE user_id != $1`, [adminId], 'wishlists');

    // 14. Reviews
    await safeDelete(client, `DELETE FROM reviews WHERE guest_id != $1`, [adminId], 'reviews');

    // 15. Availability overrides
    await safeDelete(client, `DELETE FROM availability_overrides WHERE created_by != $1`, [adminId], 'availability_overrides');

    // 16. Meal plan price overrides
    await safeDelete(client, `DELETE FROM meal_plan_price_overrides WHERE created_by != $1`, [adminId], 'meal_plan_price_overrides');

    // 17. Room price overrides
    await safeDelete(client, `DELETE FROM room_price_overrides WHERE created_by != $1`, [adminId], 'room_price_overrides');

    // 18. Bookings
    await safeDelete(client, `DELETE FROM bookings WHERE guest_id != $1`, [adminId], 'bookings');

    // 19. KYC applications
    await safeDelete(client, `DELETE FROM kyc_applications WHERE user_id != $1`, [adminId], 'kyc_applications');

    // 20. Property deactivation requests
    await safeDelete(client, `DELETE FROM property_deactivation_requests WHERE owner_id != $1`, [adminId], 'property_deactivation_requests');

    // 21. Owner referrals
    await safeDelete(client, `DELETE FROM owner_referrals WHERE referee_id != $1 OR referrer_id != $1`, [adminId], 'owner_referrals');

    // 22. Subscription payments
    await safeDelete(client, `DELETE FROM subscription_payments WHERE owner_id != $1`, [adminId], 'subscription_payments');

    // 23. Invoices
    await safeDelete(client, `DELETE FROM invoices WHERE owner_id != $1`, [adminId], 'invoices');

    // 24. Owner subscriptions
    await safeDelete(client, `DELETE FROM owner_subscriptions WHERE owner_id != $1`, [adminId], 'owner_subscriptions');

    // 25. Subscription plans (created_by)
    await safeDelete(client, `UPDATE subscription_plans SET created_by = NULL WHERE created_by != $1`, [adminId], 'subscription_plans.created_by');

    // 26. Conversations
    await safeDelete(client, `DELETE FROM conversations WHERE guest_id != $1 OR owner_id != $1`, [adminId], 'conversations');

    // 27. Property child records then properties
    await safeDelete(client, `DELETE FROM property_images WHERE property_id IN (SELECT id FROM properties WHERE owner_id != $1)`, [adminId], 'property_images');
    await safeDelete(client, `DELETE FROM property_amenities WHERE property_id IN (SELECT id FROM properties WHERE owner_id != $1)`, [adminId], 'property_amenities');
    await safeDelete(client, `DELETE FROM property_meal_plans WHERE property_id IN (SELECT id FROM properties WHERE owner_id != $1)`, [adminId], 'property_meal_plans');
    await safeDelete(client, `DELETE FROM property_rooms WHERE property_id IN (SELECT id FROM properties WHERE owner_id != $1)`, [adminId], 'property_rooms');
    await safeDelete(client, `DELETE FROM property_availability WHERE property_id IN (SELECT id FROM properties WHERE owner_id != $1)`, [adminId], 'property_availability');
    await safeDelete(client, `DELETE FROM properties WHERE owner_id != $1`, [adminId], 'properties');

    // 28. NULL out any remaining FK references before deleting users
    await safeDelete(client, `UPDATE properties SET verified_by = NULL WHERE verified_by != $1`, [adminId], 'properties.verified_by');
    await safeDelete(client, `UPDATE bookings SET checked_in_by = NULL WHERE checked_in_by != $1`, [adminId], 'bookings.checked_in_by');
    await safeDelete(client, `UPDATE bookings SET checked_out_by = NULL WHERE checked_out_by != $1`, [adminId], 'bookings.checked_out_by');
    await safeDelete(client, `UPDATE bookings SET no_show_marked_by_user_id = NULL WHERE no_show_marked_by_user_id != $1`, [adminId], 'bookings.no_show_marked_by_user_id');
    await safeDelete(client, `UPDATE kyc_applications SET reviewed_by = NULL WHERE reviewed_by != $1`, [adminId], 'kyc_applications.reviewed_by');
    await safeDelete(client, `UPDATE users SET suspended_by = NULL WHERE suspended_by != $1`, [adminId], 'users.suspended_by');
    await safeDelete(client, `UPDATE users SET deactivated_by = NULL WHERE deactivated_by != $1`, [adminId], 'users.deactivated_by');
    await safeDelete(client, `UPDATE property_deactivation_requests SET admin_id = NULL WHERE admin_id != $1`, [adminId], 'property_deactivation_requests.admin_id');
    await safeDelete(client, `UPDATE support_conversations SET assigned_admin_id = NULL WHERE assigned_admin_id != $1`, [adminId], 'support_conversations.assigned_admin_id');

    // 29. Delete all non-admin users
    const r = await client.query(`DELETE FROM users WHERE id != $1`, [adminId]);
    console.log(`  users: ${r.rowCount} deleted`);

    await client.query('COMMIT');

    // Verify
    const verify = await client.query(`SELECT id, email, user_role FROM users`);
    console.log(`\n✓ ${label} done. Remaining users:`);
    verify.rows.forEach(u => console.log(`  - ${u.email} (${u.user_role}) [${u.id}]`));

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`ERROR in ${label}:`, err);
    throw err;
  } finally {
    client.release();
  }
}

async function main() {
  // ── PRODUCTION (Neon) ───────────────────────────────────────────────────────
  const neonUrl = process.env.NEON_DATABASE_URL;
  if (!neonUrl) throw new Error('NEON_DATABASE_URL not set');

  const prodPool = new Pool({ connectionString: neonUrl, ssl: { rejectUnauthorized: false } });
  await cleanDatabase(prodPool, PROD_ADMIN_ID, 'PRODUCTION');
  await prodPool.end();

  // ── DEVELOPMENT (Replit DB) ─────────────────────────────────────────────────
  const devUrl = process.env.DATABASE_URL;
  if (!devUrl) throw new Error('DATABASE_URL not set');

  const devPool = new Pool({ connectionString: devUrl, ssl: { rejectUnauthorized: false } });
  const devClient = await devPool.connect();

  // Upsert admin user in dev
  const existing = await devClient.query(`SELECT id FROM users WHERE email = $1`, [DEV_ADMIN_EMAIL]);
  let devAdminId: string;

  if (existing.rows.length > 0) {
    devAdminId = existing.rows[0].id;
    console.log(`\nDev admin already exists: ${devAdminId}`);
  } else {
    const { randomUUID } = await import('crypto');
    devAdminId = randomUUID();
    await devClient.query(`
      INSERT INTO users (id, email, first_name, last_name, user_role, password_hash, registration_method, email_verified_at)
      VALUES ($1, $2, $3, $4, 'admin', $5, 'local', NOW())
    `, [devAdminId, DEV_ADMIN_EMAIL, DEV_ADMIN_FIRST, DEV_ADMIN_LAST, DEV_ADMIN_HASH]);
    console.log(`\nDev admin created: ${devAdminId}`);
  }
  devClient.release();

  await cleanDatabase(devPool, devAdminId, 'DEVELOPMENT');
  await devPool.end();

  console.log('\n✓✓ Both databases cleaned successfully.');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
