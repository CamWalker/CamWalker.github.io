import { types, getSnapshot } from 'mobx-state-tree';
import Chance from 'chance';

const { model, array, optional, boolean, integer, maybeNull } = types;

const ONE_DAY = 1000 * 60 * 60 * 24;

const ColorModel = model('ColorModel', {
	r: optional(integer, 0),
	g: optional(integer, 0),
	b: optional(integer, 0),
})
	.views(self => ({
		get hex() {
			// Create the hex code for the array.
			let szColor = "";
			const szOne = self.r.toString(16);
			const szTwo = self.g.toString(16);
			const szThr = self.b.toString(16);
			
			if (szOne.length === 1) szColor += "0" + szOne; else szColor += szOne;
			if (szTwo.length === 1) szColor += "0" + szTwo; else szColor += szTwo;
			if (szThr.length === 1) szColor += "0" + szThr; else szColor += szThr;
			
			return `#${szColor}`;
		},
		get rgb() {
			return [self.r, self.g, self.b];
		},
		get rgbString() {
			return `rgb(${self.rgb.join(', ')})`;
		}
	}));

const HistoryModel = model('HistoryModel', {
	todayTimestamp: integer,
	hasStarted: optional(boolean, false),
	submissions: array(ColorModel),
	todayChallenge: optional(ColorModel, {}),
})
.views(self => ({
	get isWon() {
		if (self.submissions.length === 0) return false;
		const lastSubmission = self.submissions[self.submissions.length - 1];
		return (
			self.todayChallenge.r === lastSubmission.r
			&& self.todayChallenge.g === lastSubmission.g
			&& self.todayChallenge.b === lastSubmission.b
		);
	},
	get submissionCount() {
		return self.submissions.length;
	},
	wasOneDayBefore(timestamp) {
		return timestamp - ONE_DAY === self.todayTimestamp;
	},
}));

const RootModel = model('RootModel', {
	hasStarted: optional(boolean, false),
	seconds: optional(integer, 0),
	submissions: array(ColorModel), // guesses
	selectedColors: array(maybeNull(ColorModel)), // selected inputs
	todayChallenge: optional(ColorModel, {}),
	history: array(HistoryModel),
	showStats: optional(boolean, false),
})
	.views(self => ({
		get selectedColorsOnly() {
			return self.selectedColors.filter(c => !!c);
		},
		get inputColors() {
			return [
				[238, 17, 17], // #EE1111
				[238, 238, 17], // #EEEE11
				[17, 17, 238], // #1111EE
				[255, 255, 255], // #FFFFFF
			];
		},
		get maxSelection() {
			return 10;
		},
		get isWon() {
			return self.submissions.length > 0 
				&& self.submissions[self.submissions.length - 1].hex === self.todayChallenge.hex;
		},
		get isLost() {
			return self.submissions.length === 6 && !self.isWon;
		},
		get mixedColors() {
			return self.mix(...self.selectedColorsOnly.map(c => c.rgb));
		},
		get mixedColorString() {
			if (self.selectedColorsOnly.length > 0) {
				return `rgb(${self.mixedColors.join(', ')})`;
			}
	
			return '#FFFFFF';
		},
		get confettiColors() {
			return [
				self.todayChallenge.rgbString,
				...self.inputColors.map((color) => `rgb(${self.mix(color, self.todayChallenge.rgb, self.todayChallenge.rgb, self.todayChallenge.rgb).join(', ')})`),
			];
		},
		get canSubmit() {
			return !(self.isWon || self.isLost || self.selectedColorsOnly.length !== self.maxSelection);
		},
		mix(...colors) {
			function sumColors(summedColors, nextColor) {
				return summedColors.map(
					(summedColor, i) => nextColor[i] + summedColor,
				);
			}
			function averageColors(colors) {
				return colors
					.reduce(sumColors, [0, 0, 0])
					.map(c => c/colors.length);
			}
	
			// Remove white from all colors
			const whiteParts = [];
			const colorParts = [];
			colors.forEach(color => {
				const whiteVal = Math.min(...color);
				whiteParts.push([whiteVal, whiteVal, whiteVal]);
				colorParts.push(color.map(val => val - whiteVal));
			});
			
			// Average the whites from each selection
			const averagedWhite = averageColors(whiteParts);
			// Average all non-white colors
			let averagedColor = averageColors(colorParts);
	
			// Take out the white from the averaged colors
			const whitePart = Math.min(...averagedColor);
			averagedColor = averagedColor.map(color => color - whitePart);
	
			// Half the white value removed and add that value to the Green
			averagedColor[1] += (whitePart / 2);
			
			// Add the averaged white back in and make whole number
			averagedColor = averagedColor.map((color, i) => Math.floor(color + averagedWhite[i]));

			return averagedColor;
		},
		get todayUTC() {
			const today = new Date();
			today.setUTCHours(0, 0, 0, 0);
			return today.getTime();
		},
		get todayHistoryIndex() {
			return self.history.findIndex(day => day.todayTimestamp === self.todayUTC);
		},
		get todayHistory() {
			return self.history[self.todayHistoryIndex];
		},
		get stats() {
			let playedCount = self.history.length;
			let wonCount = 0;
			let todayStreak = 0;
			let currentStreak = 0;
			let longestStreak = 0;
			let hasLost = false;
			const breakDown = [0,0,0,0,0,0];
			for (let index = playedCount - 1; index >= 0; index--) {
				const day = self.history[index];
				const yesterday = self.history[index - 1];
				if (day.isWon && (!yesterday || yesterday.wasOneDayBefore(day.todayTimestamp))) {
					wonCount++;
					currentStreak++;
				} else {
					if (currentStreak > longestStreak) {
						longestStreak = currentStreak;
					}
					currentStreak = 0;
					hasLost = true;
				}

				if (!hasLost) {
					todayStreak++;
				}

				breakDown[day.submissionCount - 1] += 1;
			}

			if (currentStreak > longestStreak) {
				longestStreak = currentStreak;
			}

			return {
				playedCount,
				wonPercent: Math.round(wonCount / playedCount * 100),
				todayStreak,
				longestStreak,
				averageGuesses: Math.round((breakDown.reduce((sum, v, i) => sum + (v * (i + 1)), 0) / breakDown.reduce((sum, v) => sum + v, 0)) * 10) / 10,
				breakDown,
			}
		}
	}))
	.actions(self => ({
		afterCreate() {
			self.fetchHistory();
			self.setTodayChallenge();
			self.setSelectedColors(Array(self.maxSelection).fill(null));
			if (self.isLost || self.isWon) {
				self.setShowStats(true);
			}
		},
		fetchHistory() {
			let stringHistory = localStorage.getItem('game_history');
			if (!stringHistory) {
				self.saveTodayHistory()
			} else {
				self.history = JSON.parse(stringHistory);
				self.applyTodayHistory();
			}
		},
		saveTodayHistory() {
			const todayHistory = {
				todayTimestamp: self.todayUTC,
				hasStarted: self.hasStarted,
				submissions: getSnapshot(self.submissions),
				todayChallenge: getSnapshot(self.todayChallenge),
			};

			if (!self.todayHistory) {
				self.history.push(todayHistory);
			} else {
				self.history[self.todayHistoryIndex] = todayHistory;
			}
			self.saveHistory();
		},
		saveHistory() {
			// self.saveTodayHistory();
			localStorage.setItem('game_history', JSON.stringify(getSnapshot(self.history)));
		},
		applyTodayHistory() {
			if (!self.todayHistory) {
				self.saveTodayHistory();
			}

			self.hasStarted = self.todayHistory.hasStarted;
			self.submissions = getSnapshot(self.todayHistory.submissions);
			self.todayChallenge = getSnapshot(self.todayHistory.todayChallenge);
		},
		setTodayChallenge() {
			const seed = self.todayUTC;
			// const seed = Date.now();
			const chance = new Chance(seed);
			const colorsToMix = Array(self.maxSelection).fill(null).map(() => {
				const index = chance.integer({ min: 0, max: 3 });
				return self.inputColors[index];
			});
			const challengeRGB = self.mix(...colorsToMix);
			self.todayChallenge = {
				r: challengeRGB[0],
				g: challengeRGB[1],
				b: challengeRGB[2],
			};
			self.saveTodayHistory();
		},
		setHasStarted(hasStarted) {
			self.hasStarted = hasStarted;
			self.saveTodayHistory();
		},
		setSeconds(seconds) {
			self.seconds = seconds;
		},
		setSubmissions(submissions) {
			self.submissions = submissions;
			self.saveTodayHistory();
		},
		setSelectedColors(selectedColors) {
			self.selectedColors = selectedColors;
		},
		setShowStats(showStats) {
			self.showStats = showStats;
		},
		countDown(seconds) {
			self.setSeconds(seconds);
			if (seconds > 0) {
				setTimeout(() => {
					self.countDown(self.seconds - 1);
				}, 1000);
			}
		},
		addColor([r, g, b]) {
			if (
				self.selectedColorsOnly.length < self.maxSelection
				&& self.hasStarted
				&& !self.isWon
				&& !self.isLost
			) {
				const index = self.selectedColors.findIndex(c => !c);
				self.selectedColors[index] = { r, g, b };
			}
		},
		removeColor(index) {
			if (
				self.hasStarted
				&& !self.isWon
				&& !self.isLost
			) {
				self.selectedColors[index] = null;
			}
		},
		submit() {
			if (
				!self.isWon
				&& self.selectedColorsOnly.length === self.maxSelection
				&& self.submissions.length < 6
			) {
				const mixedColor = self.mixedColors;
				self.submissions.push({
					r: mixedColor[0],
					g: mixedColor[1],
					b: mixedColor[2],
				});
				self.saveTodayHistory();
				if (self.mixedColorString !== self.todayChallenge.rgbString) {
					self.countDown(3);
				}

				if (self.isLost ||  self.isWon) {
					self.setShowStats(true);
				}
			}
		},
	}));

export default RootModel.create();