import rootStore from './rootStore';

const ONE_DAY = 1000 * 60 * 60 * 24;

const black = {
	r: 0,
	g: 0,
	b: 0,
}

const orange = {
	r: 255,
	g: 127,
	b: 0
};

const singleHistory = {
	todayTimestamp: rootStore.todayUTC,
	hasStarted: true,
	submissions: [black, black, black, orange],
	todayChallenge: orange,
};

describe('rootStore.js', () => {
	describe('stats', () => {
		beforeEach(() => {
			rootStore.setHistory([]);
		});

		test('calculates default stats', () => {
			expect(rootStore.stats).toEqual({
				playedCount: 0,
				wonPercent: 0,
				todayStreak: 0,
				longestStreak: 0,
				averageGuesses: 0,
				breakDown: [0,0,0,0,0,0],
			});
		});

		test('calculates stats after one won game', () => {
			rootStore.setHistory([singleHistory]);
			expect(rootStore.stats).toEqual({
				playedCount: 1,
				wonPercent: 100,
				todayStreak: 1,
				longestStreak: 1,
				averageGuesses: 4,
				breakDown: [0,0,0,1,0,0],
			});
		});

		test('calculates stats after 10 won games', () => {
			const history = Array(10).fill(null).map((_, i) => {
				return {
					...singleHistory,
					todayTimestamp: singleHistory.todayTimestamp - ((9 - i) * ONE_DAY),
				};
			});
			rootStore.setHistory(history);
			expect(rootStore.stats).toEqual({
				playedCount: 10,
				wonPercent: 100,
				todayStreak: 10,
				longestStreak: 10,
				averageGuesses: 4,
				breakDown: [0,0,0,10,0,0],
			});
		});

		test('calculates stats after 9 won games with a loss in the middle', () => {
			const history = Array(10).fill(null).map((_, i) => {
				return {
					...singleHistory,
					todayTimestamp: singleHistory.todayTimestamp - ((9 - i) * ONE_DAY),
					...(i === 7 && { submissions: [black, black, black, black, black, black] })
				};
			});
			rootStore.setHistory(history);
			expect(rootStore.stats).toEqual({
				playedCount: 10,
				wonPercent: 90,
				todayStreak: 2,
				longestStreak: 7,
				averageGuesses: 4,
				breakDown: [0,0,0,9,0,0],
			});
		});

		test('calculates stats after 9 won games with an incomplete in the middle', () => {
			const history = Array(10).fill(null).map((_, i) => {
				return {
					...singleHistory,
					todayTimestamp: singleHistory.todayTimestamp - ((9 - i) * ONE_DAY),
					...(i === 7 && { submissions: [black] })
				};
			});
			rootStore.setHistory(history);
			expect(rootStore.stats).toEqual({
				playedCount: 10,
				wonPercent: 90,
				todayStreak: 2,
				longestStreak: 7,
				averageGuesses: 4,
				breakDown: [0,0,0,9,0,0],
			});
		});

		test('calculates stats after 9 won games with an loss at the end', () => {
			const history = Array(10).fill(null).map((_, i) => {
				return {
					...singleHistory,
					todayTimestamp: singleHistory.todayTimestamp - ((9 - i) * ONE_DAY),
					...(i === 9 && { submissions: [black, black, black, black, black, black] })
				};
			});
			rootStore.setHistory(history);
			expect(rootStore.stats).toEqual({
				playedCount: 10,
				wonPercent: 90,
				todayStreak: 0,
				longestStreak: 9,
				averageGuesses: 4,
				breakDown: [0,0,0,9,0,0],
			});
		});

		test('calculates stats when winning after a string of losses', () => {
			const history = Array(10).fill(null).map((_, i) => {
				return {
					...singleHistory,
					todayTimestamp: singleHistory.todayTimestamp - ((9 - i) * ONE_DAY),
					...((i <= 8 && i >= 2) && { submissions: [black, black, black, black, black, black] })
				};
			});
			rootStore.setHistory(history);
			expect(rootStore.stats).toEqual({
				playedCount: 10,
				wonPercent: 30,
				todayStreak: 1,
				longestStreak: 2,
				averageGuesses: 4,
				breakDown: [0,0,0,3,0,0],
			});
		});

		test('calculates stats after one lost game', () => {
			rootStore.setHistory([{
				...singleHistory,
				submissions: [black, black, black, black, black, black]
			}]);
			expect(rootStore.stats).toEqual({
				playedCount: 1,
				wonPercent: 0,
				todayStreak: 0,
				longestStreak: 0,
				averageGuesses: 0,
				breakDown: [0,0,0,0,0,0],
			});
		});

		test('calculates stats after incomplete lost game', () => {
			rootStore.setHistory([{
				...singleHistory,
				submissions: [black]
			}]);
			expect(rootStore.stats).toEqual({
				playedCount: 1,
				wonPercent: 0,
				todayStreak: 0,
				longestStreak: 0,
				averageGuesses: 0,
				breakDown: [0,0,0,0,0,0],
			});
		});
	});
});
