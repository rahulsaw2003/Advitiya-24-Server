import nodeMailer from "nodemailer";

const sendEmail = async (options) => {
	const transporter = nodeMailer.createTransport({
		service: process.env.SMTP_SERVICE,
		host: process.env.SMTP_HOST,
		port: process.env.SMTP_PORT,
		secure: true,
		auth: {
			user: process.env.SMTP_EMAIL,
			pass: process.env.SMTP_PASSWORD,
		},
	});

	const mailOptions = {
		from: {
			name: process.env.SMTP_FROM_NAME,
			address: process.env.SMTP_EMAIL,
		},
		to: options.email,
		subject: options.subject,
		text: options.message,
	};

	return new Promise((resolve, reject) => {
		transporter
			.sendMail(mailOptions)
			.then((info) => {
				console.log(`Email sent successfully: ${info.messageId}`);
				resolve(info);
			})
			.catch((err) => {
				console.log(`Error occurred while sending Email: ${err.message}`);
				reject(err);
			});
	});
};

export default sendEmail;
