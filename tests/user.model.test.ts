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
		const tables = ["users", "games", "reviews"];

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
		});
	};

	test("User was created.", async () => {
		const user = await createUser({ password: "Password123" });

		expect(user.props.email).toBe("user@email.com");
		expect(user.props.password).toBe("Password123");
		expect(user.props.createdAt).toBeTruthy();
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

	
	test("User has default profile picture", async () => {
		const user = await createUser({ password: "Password123" });
		expect(user.props.pfp).toBe("https://i.pinimg.com/564x/af/0a/0a/af0a0af3734b37b50e7f48eacb3b09a6.jpg");
	});

	test("User has default username", async () => {
		const user = await createUser({ password: "Password123" });
		expect(user.props.username).toBe("Guest");
	});

	
	test("User has updated profile picture", async () => {
		const user = await createUser({ password: "Password123" });
		const newUser = await User.updatePfp(sql, user.props.id!, "testPfp")
		expect(newUser.props.pfp).toBe("testPfp");
	});

		
	test("User has updated username", async () => {
		const user = await createUser({ password: "Password123" });
		const newUser = await User.updateUsername(sql, user.props.id!, "newUsername")
		expect(newUser.props.username).toBe("newUsername");
	});

	
});
