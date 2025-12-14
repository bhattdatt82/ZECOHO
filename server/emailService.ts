// Referenced from connection:conn_resend_01KBVF5WVPAY4D2KC0ESJT2VAN
import { Resend } from 'resend';

async function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'ZECOHO <onboarding@resend.dev>';
  
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable not set');
  }
  
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail
  };
}

export async function sendOtpEmail(email: string, otp: string, purpose: 'Login' | 'Password Reset' = 'Login'): Promise<boolean> {
  try {
    console.log('Attempting to send OTP email to:', email, 'for:', purpose);
    const { client, fromEmail } = await getResendClient();
    console.log('Resend client obtained, using from email:', fromEmail);
    
    const isPasswordReset = purpose === 'Password Reset';
    const subject = isPasswordReset ? 'Reset Your ZECOHO Password' : 'Your ZECOHO Login Code';
    const heading = isPasswordReset ? 'Password Reset Code' : 'Your Login Code';
    const description = isPasswordReset 
      ? 'Enter this code to reset your ZECOHO password. This code expires in 10 minutes.'
      : 'Enter this code to sign in to your ZECOHO account. This code expires in 10 minutes.';
    
    const { data, error } = await client.emails.send({
      from: fromEmail || 'ZECOHO <noreply@zecoho.com>',
      to: [email],
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 480px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">ZECOHO</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Your Journey, Our Passion</p>
            </div>
            
            <div style="padding: 32px;">
              <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">${heading}</h2>
              <p style="color: #6b7280; margin: 0 0 24px 0; line-height: 1.5;">
                ${description}
              </p>
              
              <div style="background: #f3f4f6; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1f2937;">${otp}</span>
              </div>
              
              <p style="color: #9ca3af; font-size: 13px; margin: 0; line-height: 1.5;">
                If you didn't request this code, you can safely ignore this email. Someone may have typed your email by mistake.
              </p>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                ZECOHO - Zero Commission Hotel Booking<br>
                Connect directly with property owners
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend API error sending OTP email:', JSON.stringify(error, null, 2));
      return false;
    }

    console.log('OTP email sent successfully:', data?.id);
    return true;
  } catch (error: any) {
    console.error('Failed to send OTP email - Exception:', error?.message || error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    return false;
  }
}

// KYC Email Notifications

export async function sendKycSubmittedEmail(email: string, firstName: string): Promise<boolean> {
  try {
    console.log('Sending KYC submitted notification to:', email);
    const { client, fromEmail } = await getResendClient();
    
    const { data, error } = await client.emails.send({
      from: fromEmail || 'ZECOHO <noreply@zecoho.com>',
      to: [email],
      subject: 'KYC Application Received - ZECOHO',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 480px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">ZECOHO</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Your Journey, Our Passion</p>
            </div>
            
            <div style="padding: 32px;">
              <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">Application Received!</h2>
              <p style="color: #6b7280; margin: 0 0 16px 0; line-height: 1.5;">
                Hi ${firstName || 'Property Owner'},
              </p>
              <p style="color: #6b7280; margin: 0 0 24px 0; line-height: 1.5;">
                We've received your KYC application and property listing request. Our team is now reviewing your documents and information.
              </p>
              
              <div style="background: #ecfdf5; border-radius: 8px; padding: 16px; margin-bottom: 24px; border-left: 4px solid #10b981;">
                <p style="color: #065f46; margin: 0; font-weight: 500;">What happens next?</p>
                <ul style="color: #047857; margin: 12px 0 0 0; padding-left: 20px; line-height: 1.6;">
                  <li>Our team will review your documents (1-3 business days)</li>
                  <li>You'll receive an email once your application is approved</li>
                  <li>Your property will go live after approval</li>
                </ul>
              </div>
              
              <p style="color: #9ca3af; font-size: 13px; margin: 0; line-height: 1.5;">
                You can check your application status anytime by logging into your owner dashboard.
              </p>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                ZECOHO - Zero Commission Hotel Booking<br>
                Connect directly with property owners
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Failed to send KYC submitted email:', error);
      return false;
    }

    console.log('KYC submitted email sent successfully:', data?.id);
    return true;
  } catch (error: any) {
    console.error('Failed to send KYC submitted email:', error?.message || error);
    return false;
  }
}

export async function sendKycApprovedEmail(email: string, firstName: string, propertyName?: string): Promise<boolean> {
  try {
    console.log('Sending KYC approved notification to:', email);
    const { client, fromEmail } = await getResendClient();
    
    const { data, error } = await client.emails.send({
      from: fromEmail || 'ZECOHO <noreply@zecoho.com>',
      to: [email],
      subject: 'Congratulations! Your KYC is Approved - ZECOHO',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 480px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">ZECOHO</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Your Journey, Our Passion</p>
            </div>
            
            <div style="padding: 32px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="width: 64px; height: 64px; background: #dcfce7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                  <span style="font-size: 32px;">&#10003;</span>
                </div>
              </div>
              
              <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; text-align: center;">You're Approved!</h2>
              <p style="color: #6b7280; margin: 0 0 16px 0; line-height: 1.5;">
                Hi ${firstName || 'Property Owner'},
              </p>
              <p style="color: #6b7280; margin: 0 0 24px 0; line-height: 1.5;">
                Great news! Your KYC verification has been approved${propertyName ? ` and your property "${propertyName}" is now live on ZECOHO` : ' and you can now list your properties on ZECOHO'}.
              </p>
              
              <div style="background: #ecfdf5; border-radius: 8px; padding: 16px; margin-bottom: 24px; border-left: 4px solid #10b981;">
                <p style="color: #065f46; margin: 0; font-weight: 500;">You can now:</p>
                <ul style="color: #047857; margin: 12px 0 0 0; padding-left: 20px; line-height: 1.6;">
                  <li>Receive direct bookings with ZERO commission</li>
                  <li>Manage your property through the owner dashboard</li>
                  <li>Communicate directly with guests</li>
                  <li>Track earnings and reviews</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="https://zecoho.replit.app/owner/dashboard" style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600;">
                  Go to Owner Dashboard
                </a>
              </div>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                ZECOHO - Zero Commission Hotel Booking<br>
                Connect directly with property owners
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Failed to send KYC approved email:', error);
      return false;
    }

    console.log('KYC approved email sent successfully:', data?.id);
    return true;
  } catch (error: any) {
    console.error('Failed to send KYC approved email:', error?.message || error);
    return false;
  }
}

export async function sendKycRejectedEmail(email: string, firstName: string, rejectionReasons?: string[]): Promise<boolean> {
  try {
    console.log('Sending KYC rejected notification to:', email);
    const { client, fromEmail } = await getResendClient();
    
    const reasonsList = rejectionReasons && rejectionReasons.length > 0 
      ? `<ul style="color: #dc2626; margin: 12px 0 0 0; padding-left: 20px; line-height: 1.6;">${rejectionReasons.map(r => `<li>${r}</li>`).join('')}</ul>`
      : '<p style="color: #dc2626; margin: 12px 0 0 0;">Please check your dashboard for details.</p>';
    
    const { data, error } = await client.emails.send({
      from: fromEmail || 'ZECOHO <noreply@zecoho.com>',
      to: [email],
      subject: 'Action Required: KYC Application Update - ZECOHO',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 480px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">ZECOHO</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Your Journey, Our Passion</p>
            </div>
            
            <div style="padding: 32px;">
              <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">Action Required</h2>
              <p style="color: #6b7280; margin: 0 0 16px 0; line-height: 1.5;">
                Hi ${firstName || 'Property Owner'},
              </p>
              <p style="color: #6b7280; margin: 0 0 24px 0; line-height: 1.5;">
                We've reviewed your KYC application and unfortunately, we need some additional information or corrections before we can approve it.
              </p>
              
              <div style="background: #fef2f2; border-radius: 8px; padding: 16px; margin-bottom: 24px; border-left: 4px solid #dc2626;">
                <p style="color: #991b1b; margin: 0; font-weight: 500;">Issues found:</p>
                ${reasonsList}
              </div>
              
              <p style="color: #6b7280; margin: 0 0 24px 0; line-height: 1.5;">
                Don't worry - you can easily fix these issues and resubmit your application.
              </p>
              
              <div style="text-align: center;">
                <a href="https://zecoho.replit.app/owner/kyc" style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600;">
                  Update Your Application
                </a>
              </div>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                ZECOHO - Zero Commission Hotel Booking<br>
                Need help? Contact support@zecoho.com
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Failed to send KYC rejected email:', error);
      return false;
    }

    console.log('KYC rejected email sent successfully:', data?.id);
    return true;
  } catch (error: any) {
    console.error('Failed to send KYC rejected email:', error?.message || error);
    return false;
  }
}

export async function sendPropertyLiveEmail(email: string, firstName: string, propertyName: string): Promise<boolean> {
  try {
    console.log('Sending property live notification to:', email);
    const { client, fromEmail } = await getResendClient();
    
    const { data, error } = await client.emails.send({
      from: fromEmail || 'ZECOHO <noreply@zecoho.com>',
      to: [email],
      subject: `Your Property is Now Live! - ${propertyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 480px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">ZECOHO</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Your Journey, Our Passion</p>
            </div>
            
            <div style="padding: 32px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="width: 64px; height: 64px; background: #dcfce7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                  <span style="font-size: 32px;">&#127968;</span>
                </div>
              </div>
              
              <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; text-align: center;">Your Property is Live!</h2>
              <p style="color: #6b7280; margin: 0 0 16px 0; line-height: 1.5;">
                Hi ${firstName || 'Property Owner'},
              </p>
              <p style="color: #6b7280; margin: 0 0 24px 0; line-height: 1.5;">
                Great news! <strong>"${propertyName}"</strong> is now live on ZECOHO and visible to travelers searching for accommodations.
              </p>
              
              <div style="background: #ecfdf5; border-radius: 8px; padding: 16px; margin-bottom: 24px; border-left: 4px solid #10b981;">
                <p style="color: #065f46; margin: 0; font-weight: 500;">What's next?</p>
                <ul style="color: #047857; margin: 12px 0 0 0; padding-left: 20px; line-height: 1.6;">
                  <li>Check your owner dashboard regularly for booking inquiries</li>
                  <li>Respond to messages quickly for better visibility</li>
                  <li>Keep your calendar and pricing up to date</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="https://zecoho.replit.app/owner/dashboard" style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600;">
                  View Your Dashboard
                </a>
              </div>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                ZECOHO - Zero Commission Hotel Booking<br>
                Enjoy ZERO commission on all bookings!
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Failed to send property live email:', error);
      return false;
    }

    console.log('Property live email sent successfully:', data?.id);
    return true;
  } catch (error: any) {
    console.error('Failed to send property live email:', error?.message || error);
    return false;
  }
}
