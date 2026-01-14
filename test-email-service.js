import emailService, {
  sendRegistrationOtp,
  sendPasswordResetOtp,
  sendAccountCreationEmail,
  sendWelcomeEmail,
} from "./services/email.service.js";

async function testEmailService() {
  console.log("\n🧪 Testing Email Service...\n");
  //   const email = "ahmed.aljohani.it@gmail.com";
  const email = "shabeebkaip@gmail.com";
  // Test 1: Connection verification
  console.log("Test 1: Verifying email connection...");
  const connected = await emailService.verifyConnection();
  if (!connected) {
    console.error("❌ Connection failed. Aborting tests.");
    return;
  }
  console.log("✅ Connection verified\n");

  // Test 2: Send Registration OTP
  console.log("Test 2: Sending Registration OTP email...");
  const otpResult = await sendRegistrationOtp("Test User", email, "123456");
  console.log("Result:", otpResult);
  console.log("");

  // Test 3: Send Password Reset OTP
  console.log("Test 3: Sending Password Reset OTP email...");
  const resetResult = await sendPasswordResetOtp("Test User", email, "654321");
  console.log("Result:", resetResult);
  console.log("");

  // Test 4: Send Account Creation Email
  console.log("Test 4: Sending Account Creation email...");
  const accountResult = await sendAccountCreationEmail(
    "Test Expert",
    email,
    "TempPass123!"
  );
  console.log("Result:", accountResult);
  console.log("");

  // Test 5: Send Welcome Email
  console.log("Test 5: Sending Welcome email...");
  const welcomeResult = await sendWelcomeEmail("New User", email);
  console.log("Result:", welcomeResult);
  console.log("");

  // Test 6: Generic email
  console.log("Test 6: Sending generic notification...");
  const genericResult = await emailService.sendNotification(
    email,
    "Test Notification",
    "<p>This is a test notification from the new email service.</p>"
  );
  console.log("Result:", genericResult);
  console.log("");

  console.log("\n✅ All tests completed!\n");
}

// Run tests
testEmailService().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
