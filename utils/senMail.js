const sendMail = async ({ to, subject, html }) => {
  console.log("Pretending to send email...");
  console.log("To:", to);
  console.log("Subject:", subject);
  console.log("HTML:", html);
  // Add real nodemailer logic later here.
};

export default sendMail;