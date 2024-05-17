import postgres from "postgres";
import { test, describe, expect, afterEach } from "vitest";
import { createUTCDate } from "../src/utils";
import User, { UserProps } from "../src/models/User";

describe("User CRUD operations", () => {
	// Set up the connection to the DB.
	const sql = postgres({
		database: "VideoGamedDB",
	});

	/**
	 * Clean up the database after each test. This function deletes all the rows
	 * from the todos and subtodos tables and resets the sequence for each table.
	 * @see https://www.postgresql.org/docs/13/sql-altersequence.html
	 */
	afterEach(async () => {
		const tables = ["users", "games", "reviews", "played_games"];

		try {
			for (const table of tables) {
				await sql.unsafe(`DELETE FROM ${table}`);
				await sql.unsafe(
					`ALTER SEQUENCE ${table}_id_seq RESTART WITH 1;`,
				);
			}
		} catch (error) {
			console.error(error);
		}
	});

	const createUser = async (props: Partial<UserProps> = {}) => {
		return await User.create(sql, {
			email: props.email || "user@email.com",
			password: props.password || "password",
			createdAt: props.createdAt || createUTCDate(),
			// isAdmin: props.isAdmin || false, // Uncomment if implementing admin feature.
		});
	};

	test("User was created.", async () => {
		const user = await createUser({ password: "Password123" });

		expect(user.props.email).toBe("user@email.com");
		expect(user.props.password).toBe("Password123");
		expect(user.props.createdAt).toBeTruthy();
		expect(user.props.editedAt).toBeFalsy();
	});

	test("User was not created with duplicate email.", async () => {
		await createUser({ email: "user@email.com" });

		await expect(async () => {
			await createUser({ email: "user@email.com" });
		}).rejects.toThrow("User with this email already exists.");
	});

	test("User was logged in.", async () => {
		const user = await createUser({ password: "Password123" });
		const loggedInUser = await User.login(
			sql,
			user.props.email,
			"Password123",
		);

		expect(loggedInUser?.props.email).toBe("user@email.com");
		expect(loggedInUser?.props.password).toBe("Password123");
	});

	test("User was not logged in with invalid password.", async () => {
		const user = await createUser({ password: "Password123" });

		await expect(async () => {
			await User.login(sql, user.props.email, "wrongpassword");
		}).rejects.toThrow("Invalid credentials.");
	});

	test("User was not logged in with invalid email.", async () => {
		const user = await createUser({ password: "Password123" });

		await expect(async () => {
			await User.login(sql, "invalid@email.com", "password");
		}).rejects.toThrow("Invalid credentials.");
	});

	test("User was not logged in with invalid email and password.", async () => {
		const user = await createUser({ password: "Password123" });

		await expect(async () => {
			await User.login(sql, "invalid@email.com", "wrongpassword");
		}).rejects.toThrow("Invalid credentials.");
	});

	/* Uncomment if implementing admin feature, as well as the comment above in createUser().

	test("Users were listed.", async () => {
		const user1 = await createUser({ email: "user1@email.com" });
		const user2 = await createUser({ email: "user2@email.com" });
		const user3 = await createUser({ email: "user3@email.com" });

		const users = await User.readAll(sql);

		expect(users).toHaveLength(3);
		expect(users[0].props.email).toBe(user1.props.email);
		expect(users[1].props.email).toBe(user2.props.email);
		expect(users[2].props.email).toBe(user3.props.email);
	});

	test("User was made an admin.", async () => {
		const user = await createUser();

		await user.toggleAdmin();

		expect(user.props.isAdmin).toBe(true);
	});

	test("Admin was made a user.", async () => {
		const user = await createUser({ isAdmin: true });

		await user.toggleAdmin();

		expect(user.props.isAdmin).toBe(false);
	});

	test("User was deleted.", async () => {
		const user = await createUser({ password: "Password123" });
		const result = await user.delete();

		expect(result).toBe(true);

		const deletedUser = await User.read(sql, user.props.id!);

		expect(deletedUser).toBeNull();
	});

	*/

	/* Uncomment if implementing profile feature.

	test("User was read.", async () => {
		const user = await createUser({ password: "Password123" });
		const readUser = await User.read(sql, user.props.id!);

		expect(readUser?.props.email).toBe("user@email.com");
		expect(readUser?.props.password).toBe("Password123");
	});

	test("User was updated.", async () => {
		const user = await createUser({ password: "Password123" });
		const oldPassword = user.props.password;

		await user.update({
			email: "updated@email.com",
			password: "newpassword",
		});

		expect(user.props.email).toBe("updated@email.com");
		expect(user.props.password).toBe("newpassword");
		expect(user.props.password).not.toBe(oldPassword);
		expect(user.props.editedAt).toBeTruthy();
	});

	test("User was not updated with duplicate email.", async () => {
		const user1 = await createUser({ email: "user1@email.com" });
		const user2 = await createUser({ email: "user2@email.com" });

		await expect(async () => {
			await user2.update({ email: "user1@email.com" });
		}).rejects.toThrow("User with this email already exists.");

		expect(user2.props.email).not.toBe(user1.props.email);
	});

	test("User was updated with profile picture.", async () => {
		const user = await createUser();
		const profile = "https://picsum.photos/id/238/100";

		await user.update({ profile });

		expect(user.props.profile).toBe(profile);
	});

	*/
});
