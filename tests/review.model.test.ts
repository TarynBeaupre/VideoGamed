import postgres, { toKebab } from "postgres";
import Game, { GameProps } from "../src/models/Game";
import { test, describe, expect, afterEach, beforeEach } from "vitest";
import { createUTCDate } from "../src/utils";
import User, { UserProps } from "../src/models/User";
import Review, { ReviewProps, ReviewPropsWithPicture } from "../src/models/Review";

describe("Game CRUD operations", () => {
	// Set up the connection to the DB.
	const sql = postgres({
		database: "VideoGamedDB",
	});

	/**
	 * Helper function to create a Todo with default or provided properties.
	 * @see https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype
	 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_OR#short-circuit_evaluation
	 * @param props The properties of the Todo.
	 * @default title: "Test Todo"
	 * @default description: "This is a test todo"
	 * @default status: "incomplete"
	 * @default dueAt: A week from today
	 * @default createdAt: The current date/time
	 * @returns A new Todo object that has been persisted in the DB.
	 */
	const createGame = async (props: Partial<GameProps> = {}) => {
		const gameProps: GameProps = {
			title: props.title || "Test Game",
			description: props.description || "This is a test game",
            developer: props.developer || "Test Dev",
			releaseYear: props.releaseYear || 2024,
		};

		return await Game.create(sql, gameProps);
	};

	const createUser = async (props: Partial<UserProps> = {}) => {
		return await User.create(sql, {
			email: props.email || "user@email.com",
			password: props.password || "password",
			createdAt: props.createdAt || createUTCDate(),
		});
	};

    const createReview = async (props: Partial<ReviewProps> = {}) => {
        const reviewProps: ReviewProps = {
            title: props.title || "TestReviewTitle",
			stars: props.stars || 1,
            review: props.review || "TestReview",
            userId: props.userId || 1,
            reviewedGameId: props.reviewedGameId || 1,
            likes: props.likes || 0

		};
		return await Review.create(sql, reviewProps);
	};


	beforeEach(async () => {
		await createUser();
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

	test("Review was created.", async () => {


        const game = await createGame({ title: "Test Game For Review" });

        const review = await createReview({review: "Test", reviewedGameId: game?.props.id})

        expect(review?.props.id).toBeDefined()
        expect(review?.props.title).toBe("TestReviewTitle");
        expect(review?.props.stars).toBe(1);
        expect(review?.props.review).toBe("Test");
        expect(review?.props.userId).toBe(1);
        expect(review?.props.reviewedGameId).toBe(game?.props.id);
        expect(review?.props.likes).toBe(0);
        
	});

    test("Review was retrieved.", async () => {


        const game = await createGame({ title: "Test Game For Review" });

        const review = await createReview({review: "Test", reviewedGameId: game?.props.id})

        const readReview = await Review.getSpecificReviewWithId(sql, review?.props.id!)

        expect(readReview?.props.id).toBeDefined()
        expect(readReview?.props.title).toBe("TestReviewTitle");
        expect(readReview?.props.stars).toBe(1);
        expect(readReview?.props.review).toBe("Test");
        expect(readReview?.props.userId).toBe(1);
        expect(readReview?.props.reviewedGameId).toBe(game?.props.id);
        expect(readReview?.props.likes).toBe(0);
        
	});

    test("Top 3 reviews were read.", async () => {


        const game = await createGame({ title: "Test Game For Review" });

        const review = await createReview({review: "Test1", reviewedGameId: game?.props.id, likes: 1})
        const review2 = await createReview({review: "Test2", reviewedGameId: game?.props.id, likes: 100})
        const review1 = await createReview({review: "Test3", reviewedGameId: game?.props.id, likes: 10})


        const top3 = await Review.readTop3Liked(sql)

        expect(top3).toBeDefined();

        expect(top3![0].props.review).toBe("Test2");
        expect(top3![1].props.review).toBe("Test3");
        expect(top3![2].props.review).toBe("Test1");

        
	});

    test("All reviews for a specific game were retrieved", async () => {


        const game = await createGame({ title: "Test Game For Review" });
        
        const game2 = await createGame({ title: "Test Game For Review" });

        const review = await createReview({review: "Test1", reviewedGameId: game?.props.id, likes: 1})
        const review2 = await createReview({review: "Test2", reviewedGameId: game?.props.id, likes: 100})
        const review1 = await createReview({review: "Test3", reviewedGameId: game2?.props.id, likes: 10})


        const reviews = await Review.readGameReviews(sql, game?.props.id!)

        expect(reviews).toBeDefined();

        expect(reviews.length).toBe(2)

        
	});
    
    test("All reviews from a specific user were retrieved", async () => {

        const user = await createUser({email: "review@review.com"})
        const user2 = await createUser({email: "review2@review.com"})
        const game = await createGame({ title: "Test Game For Review" });
        

        await createReview({review: "Test1", reviewedGameId: game?.props.id, userId: user.props.id})
        await createReview({review: "Test2", reviewedGameId: game?.props.id, userId: user2.props.id})


        const reviews = await Review.readUserReviews(sql, user.props.id!)

        expect(reviews).toBeDefined();

        expect(reviews![0].props.review).toBe("Test1");

        
	});
    test("Review likes were added", async () => {

        const user = await createUser({email: "review@review.com"})
        const game = await createGame({ title: "Test Game For Review" });
        const review = await createReview({review: "Test1", reviewedGameId: game?.props.id, userId: user.props.id})

        const beforeLikes = review?.props.likes

        await Review.addReviewLike(sql,review?.props.id!,user.props.id!)
        const afterReview = await Review.read(sql,review?.props.id!)

        const afterLikes = afterReview!.props.likes

        expect(beforeLikes).toBe(0);
        expect(afterLikes).toBe(1);

        
	});





});
