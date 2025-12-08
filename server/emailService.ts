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
