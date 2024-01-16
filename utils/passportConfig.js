import { Strategy as OAuth2Strategy } from "passport-google-oauth2";

const initializingPassport = (passport) => {
	// setup passport strategy
	passport.use(
		new OAuth2Strategy(
			{
				clientID: process.env.GOOGLE_CLIENT_ID,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET,
				callbackURL: `${process.env.SERVER_URL}/api/users/auth/google/callback`,
				scope: ["email", "profile"],
			},
			async (accessToken, refreshToken, profile, done) => {
				// console.log("User profile", profile);
				const newUser = {
					googleId: profile.id,
					displayName: profile.displayName,
					firstName: profile.name.givenName,
					lastName: profile.name.familyName,
					image: profile.photos[0].value,
					email: profile.emails[0].value,
				};
				try {
					return done(null, newUser);
				} catch (err) {
					console.error(err);
					return done(err, null);
				}
			}
		)
	);

	passport.serializeUser((user, done) => {
		// console.log("Serialize User:", user);
		done(null, user);
	});

	passport.deserializeUser((user, done) => {
		// console.log("Deserialize User:", user);
		done(null, user);
	});
};

export default initializingPassport;
