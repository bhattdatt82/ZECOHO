import { db } from "./db";
import { policies } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const initialTermsAndConditions = `ZECOHO – TERMS & CONDITIONS

Last Updated: January 2026

Welcome to ZECOHO ("we", "us", "our", or the "Platform"). These Terms and Conditions ("Terms") govern your access to and use of the ZECOHO website, mobile application, and related services.

By accessing or using our Platform, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Platform.

1. DEFINITIONS

1.1 "User" means any person who accesses or uses the Platform, including Guests and Property Owners.
1.2 "Guest" means a User who searches for, views, or books accommodation through the Platform.
1.3 "Property Owner" or "Owner" means a User who lists accommodation on the Platform.
1.4 "Property" means any hotel, resort, homestay, or accommodation listed on the Platform.
1.5 "Booking" means a reservation made by a Guest for accommodation at a Property.

2. ZERO COMMISSION MODEL

2.1 ZECOHO operates on a ZERO COMMISSION model. We do not charge any commission to Property Owners on bookings made through our Platform.
2.2 Guests pay the prices set directly by Property Owners without any markup by ZECOHO.
2.3 This model allows us to offer true prices to Guests while ensuring Property Owners retain 100% of their booking revenue.

3. ACCOUNT REGISTRATION

3.1 To use certain features of the Platform, you must create an account.
3.2 You agree to provide accurate, current, and complete information during registration.
3.3 You are responsible for maintaining the confidentiality of your account credentials.
3.4 You agree to notify us immediately of any unauthorized use of your account.

4. BOOKING AND PAYMENT

4.1 All bookings are subject to availability and confirmation by the Property Owner.
4.2 Payment terms are determined by the Property Owner's policies.
4.3 Cancellation and refund policies are set by individual Property Owners and displayed on Property listings.
4.4 ZECOHO facilitates payment processing but is not responsible for payment disputes between Guests and Property Owners.

5. USER CONDUCT

5.1 You agree not to use the Platform for any unlawful purpose.
5.2 You agree not to impersonate any person or entity.
5.3 You agree not to interfere with or disrupt the Platform or its servers.
5.4 You agree not to post false, misleading, or defamatory content.

6. INTELLECTUAL PROPERTY

6.1 All content on the Platform, including text, graphics, logos, and software, is the property of ZECOHO or its licensors.
6.2 You may not reproduce, distribute, or create derivative works without our express permission.

7. PRIVACY

7.1 Your use of the Platform is also governed by our Privacy Policy.
7.2 By using the Platform, you consent to the collection and use of your information as described in our Privacy Policy.

8. DISCLAIMER OF WARRANTIES

8.1 The Platform is provided "as is" without warranties of any kind.
8.2 ZECOHO does not guarantee the accuracy of Property listings or the quality of accommodations.
8.3 ZECOHO is not responsible for actions or omissions of Property Owners or Guests.

9. LIMITATION OF LIABILITY

9.1 ZECOHO shall not be liable for any indirect, incidental, or consequential damages.
9.2 Our total liability shall not exceed the amount you paid through the Platform in the last 12 months.

10. INDEMNIFICATION

10.1 You agree to indemnify and hold harmless ZECOHO from any claims arising from your use of the Platform or violation of these Terms.

11. DISPUTE RESOLUTION

11.1 Any disputes shall be resolved through arbitration in accordance with the Arbitration and Conciliation Act, 1996.
11.2 The seat of arbitration shall be India.

12. GOVERNING LAW

12.1 These Terms shall be governed by the laws of India.

13. CHANGES TO TERMS

13.1 We reserve the right to modify these Terms at any time.
13.2 Continued use of the Platform after changes constitutes acceptance of the modified Terms.

14. CONTACT

For questions about these Terms, please contact us at:
Email: support@zecoho.com

By using ZECOHO, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.`;

const initialPrivacyPolicy = `ZECOHO – PRIVACY POLICY

Last Updated: January 2026

ZECOHO Technologies Pvt. Ltd. ("ZECOHO", "we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Platform.

1. INFORMATION WE COLLECT

1.1 Personal Information
- Name, email address, phone number
- Government-issued ID (for Property Owners during KYC verification)
- Payment information
- Profile photographs

1.2 Booking Information
- Reservation details
- Communication with Property Owners
- Review and rating content

1.3 Technical Information
- IP address, device type, browser type
- Usage patterns and preferences
- Location data (with your consent)

1.4 Cookies and Tracking Technologies
- We use cookies and similar technologies to enhance your experience
- You can control cookies through your browser settings

2. HOW WE USE YOUR INFORMATION

2.1 To provide and improve our services
2.2 To process bookings and payments
2.3 To communicate with you about your account and bookings
2.4 To personalize your experience
2.5 To comply with legal obligations
2.6 To prevent fraud and ensure platform security

3. INFORMATION SHARING

3.1 With Property Owners
- We share your booking details with Property Owners to facilitate reservations
- Property Owners receive only the information necessary for your stay

3.2 Service Providers
- We may share information with third-party service providers who assist our operations
- These providers are contractually bound to protect your information

3.3 Legal Requirements
- We may disclose information when required by law or legal process
- We may share information to protect our rights or the safety of others

3.4 No Sale of Personal Information
- We do not sell your personal information to third parties

4. DATA SECURITY

4.1 We implement appropriate technical and organizational measures to protect your data
4.2 We use encryption for data transmission and storage
4.3 We regularly review and update our security practices
4.4 Despite our efforts, no method of transmission over the Internet is 100% secure

5. DATA RETENTION

5.1 We retain your information as long as your account is active
5.2 We may retain certain information to comply with legal obligations
5.3 You may request deletion of your account and data

6. YOUR RIGHTS

6.1 Access: You can request access to your personal information
6.2 Correction: You can request correction of inaccurate information
6.3 Deletion: You can request deletion of your personal information
6.4 Portability: You can request a copy of your data in a portable format
6.5 Opt-out: You can opt out of marketing communications

7. CHILDREN'S PRIVACY

7.1 Our Platform is not intended for children under 18
7.2 We do not knowingly collect information from children under 18

8. INTERNATIONAL DATA TRANSFERS

8.1 Your information may be transferred to and processed in countries other than your country of residence
8.2 We ensure appropriate safeguards are in place for such transfers

9. THIRD-PARTY LINKS

9.1 Our Platform may contain links to third-party websites
9.2 We are not responsible for the privacy practices of third-party websites

10. CHANGES TO THIS POLICY

10.1 We may update this Privacy Policy from time to time
10.2 We will notify you of significant changes
10.3 Continued use of the Platform after changes constitutes acceptance

11. GRIEVANCE OFFICER

In accordance with the Information Technology Act, 2000 and the rules made thereunder, the name and contact details of the Grievance Officer are provided on our Contact Us page.

12. CONTACT US

For questions about this Privacy Policy or our data practices, please contact:
Email: privacy@zecoho.com

By using ZECOHO, you acknowledge that you have read and understood this Privacy Policy and consent to our collection, use, and disclosure of your information as described herein.`;

export async function seedPolicies() {
  try {
    // Check if published Terms & Conditions exists
    const existingTerms = await db
      .select()
      .from(policies)
      .where(and(eq(policies.type, "terms"), eq(policies.status, "published")))
      .limit(1);

    if (existingTerms.length === 0) {
      // Create the initial Terms & Conditions
      const [terms] = await db
        .insert(policies)
        .values({
          type: "terms",
          version: 1,
          title: "Terms & Conditions",
          content: initialTermsAndConditions,
          status: "published",
          publishedAt: new Date(),
          createdBy: "system",
        })
        .returning();

      console.log("Seeded initial Terms & Conditions, version:", terms.version);
    } else {
      console.log("Terms & Conditions already exists, skipping seed");
    }

    // Check if published Privacy Policy exists
    const existingPrivacy = await db
      .select()
      .from(policies)
      .where(and(eq(policies.type, "privacy"), eq(policies.status, "published")))
      .limit(1);

    if (existingPrivacy.length === 0) {
      // Create the initial Privacy Policy
      const [privacy] = await db
        .insert(policies)
        .values({
          type: "privacy",
          version: 1,
          title: "Privacy Policy",
          content: initialPrivacyPolicy,
          status: "published",
          publishedAt: new Date(),
          createdBy: "system",
        })
        .returning();

      console.log("Seeded initial Privacy Policy, version:", privacy.version);
    } else {
      console.log("Privacy Policy already exists, skipping seed");
    }
  } catch (error) {
    console.error("Error seeding policies:", error);
    throw error;
  }
}
