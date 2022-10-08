import { types, getSnapshot } from 'mobx-state-tree';
import Chance from 'chance';
import ToastModel from './components/Toast/Toast.model';
import ColorModel from './models/color.model';
import HistoryModel from './models/history.model';
const { model, array, optional, boolean, integer, maybeNull } = types;

const ONE_DAY = 1000 * 60 * 60 * 24;

const RootModel = model('RootModel', {
	hasStarted: optional(boolean, false),
	seconds: optional(integer, 0),
	submissions: array(ColorModel), // guesses
	selectedColors: array(maybeNull(ColorModel)), // selected inputs
	todayChallenge: optional(ColorModel, {}),
	history: array(HistoryModel),
	showStats: optional(boolean, false),
	showInstructions: optional(boolean, false),
	toast: optional(ToastModel, {}),
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
				&& self.submissions.length < 7
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
		get tomorrowUTC() {
			return self.todayUTC + ONE_DAY;
		},
		getTimeUntilNextGame(currentTime) {
			let seconds = Math.floor((self.tomorrowUTC - currentTime) / 1000);

			const oneMinuteInSeconds = 60;
			const oneHourInSeconds = 60 * oneMinuteInSeconds;
			const hours = Math.floor(seconds / oneHourInSeconds);
			seconds -= hours * oneHourInSeconds;
			const minutes = Math.floor(seconds / oneMinuteInSeconds);
			seconds -= minutes * oneMinuteInSeconds;
			return `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
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
				const tomorrow = self.history.length > index + 1 && self.history[index + 1];

				if (day.isWon) {
					wonCount++;
				}

				if (day.isWon && (!tomorrow || day?.wasOneDayBefore?.(tomorrow.todayTimestamp))) {
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

				if (day.submissionCount > 0 && day.submissionCount < 7 && day.isWon) {
					breakDown[day.submissionCount - 1] += 1;
				}
			}

			if (currentStreak > longestStreak) {
				longestStreak = currentStreak;
			}

			const allGuessesCount = breakDown.reduce((sum, v, i) => sum + (v * (i + 1)), 0);
			const totalDaysPlayed = breakDown.reduce((sum, v) => sum + v, 0);

			return {
				playedCount,
				wonPercent: playedCount === 0 ? 0 : Math.round(wonCount / playedCount * 100),
				todayStreak,
				longestStreak,
				averageGuesses: allGuessesCount === 0 ? 0 : Math.round(( allGuessesCount / totalDaysPlayed ) * 10) / 10,
				breakDown,
			};;
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
				self.saveTodayHistory();
			} else {
				self.history = JSON.parse(stringHistory);
				self.applyTodayHistory();
			}
			if (self.history[0].todayTimestamp === self.todayHistory.todayTimestamp && !self.todayHistory.isWon) {
				self.setShowInstructions(true);
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
		setHistory(history) {
			self.history = history;
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
			const shouldIgnoreOne = chance.integer({ min: 0, max: 1 }) === 0;
			let indexToIgnore = shouldIgnoreOne ? chance.integer({ min: 0, max: 3 }) : null;
			
			const colorsToMix = Array(self.maxSelection).fill(null).map(() => {
				let index = null;
				do {
					index = chance.integer({ min: 0, max: 3 });
				} while (index === indexToIgnore);
				return self.inputColors[index];
			});
			const challengeRGB = self.mix(...colorsToMix);
			self.todayChallenge = {
				r: challengeRGB[0],
				g: challengeRGB[1],
				b: challengeRGB[2],
				composition: colorsToMix.map(([r, g, b]) => ({ r, g, b })),
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
		setShowInstructions(showInstructions) {
			self.showInstructions = showInstructions;
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
				&& self.seconds === 0
			) {
				const mixedColor = self.mixedColors;
				self.submissions.push({
					r: mixedColor[0],
					g: mixedColor[1],
					b: mixedColor[2],
					composition: getSnapshot(self.selectedColors),
				});
				self.saveTodayHistory();
				if (self.mixedColorString !== self.todayChallenge.rgbString) {
					self.countDown(3);
				}

				if (self.isLost ||  self.isWon) {
					if (self.isWon) {
						let text = ''
						switch (self.submissions.length) {
							case 1:
								text = 'Spectacular!';
								break;
							case 2:
							case 3:
								text = 'Well done!';
								break;
							case 4:
							case 5:
								text = 'Good job';
								break;
							case 6:
								text = 'That was a close one';
								break;
							default:
								text = 'Good job';
								break;
						}
						self.toast.show(text, 2400);
					} else {
						self.toast.show('Better luck next time', 2400);
					}
					self.setShowStats(true);
				}
			} else if (
				self.hasStarted 
				&& self.selectedColorsOnly.length !== self.maxSelection
				&& !self.isWon
				&& !self.isLost
			) {
				self.toast.show('Fill all 10 colors', 2400);
			}
		},
		copyToClipboard() {
			const todayCounts = self.todayChallenge.compositionCounts;

			const text = window.location.hostname + '\n\n' + self.submissions.map(submission => {
				const mistakeColors = [];
				const submissionCounts = submission.compositionCounts;
				for (const color in submissionCounts) {
					if (!todayCounts[color] && submissionCounts[color] > 0) {
						mistakeColors.push(...Array(submissionCounts[color]).fill(color));
					} else if (submissionCounts[color] > todayCounts[color]) {
						mistakeColors.push(...Array(submissionCounts[color] - todayCounts[color]).fill(color));
					}
				}

				const allGuesses = [].concat(
					Array(self.maxSelection - mistakeColors.length).fill(String.fromCodePoint(9989)),
					mistakeColors.map(color => {
						switch (color) {
							case 'rgb(238, 17, 17)':
								return String.fromCodePoint(128308);
							case 'rgb(238, 238, 17)':
								return String.fromCodePoint(128993);
							case 'rgb(17, 17, 238)':
								return String.fromCodePoint(128309);
							case 'rgb(255, 255, 255)':
							default:
								return String.fromCodePoint(9898);
						}
					}),
				);

				return allGuesses.join('');
			}).join('\n');

			navigator.clipboard.writeText(text);
			self.toast.show('Copied to clipboard', 2400);
		}
	}));

export default RootModel.create();