import { types, getSnapshot } from 'mobx-state-tree';
import Chance from 'chance';

const { model, array, optional, boolean, integer, string, maybeNull } = types;

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

const RootModel = model('RootModel', {
	isReady: optional(boolean, false),
	seconds: optional(integer, 0),
	submissions: array(ColorModel), // guesses
	selectedColors: array(maybeNull(ColorModel)), // selected inputs
	todaysChallenge: optional(ColorModel, {}),
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
				&& self.submissions[self.submissions.length - 1].hex === self.todaysChallenge.hex;
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
				self.todaysChallenge.rgbString,
				...self.inputColors.map((color) => `rgb(${self.mix(color, self.todaysChallenge.rgb, self.todaysChallenge.rgb, self.todaysChallenge.rgb).join(', ')})`),
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
	}))
	.actions(self => ({
		afterCreate() {
			// const today = new Date();
			// const seed = `${today.getUTCFullYear}${today.getUTCMonth}${today.getUTCDate}`;
			const seed = Date.now();
			const chance = new Chance(seed);
			const colorsToMix = Array(self.maxSelection).fill(null).map(() => {
				const index = chance.integer({ min: 0, max: 3 });
				return self.inputColors[index];
			});
			const challengeRGB = self.mix(...colorsToMix);
			self.todaysChallenge = {
				r: challengeRGB[0],
				g: challengeRGB[1],
				b: challengeRGB[2],
			};
			
			self.selectedColors = Array(self.maxSelection).fill(null);
		},
		setIsReady(isReady) {
			self.isReady = isReady;
		},
		setSeconds(seconds) {
			self.seconds = seconds;
		},
		setSubmissions(submissions) {
			self.submissions = submissions;
		},
		setSelectedColors(selectedColors) {
			self.selectedColors = selectedColors;
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
				&& self.isReady
				&& !self.isWon
				&& !self.isLost
			) {
				const index = self.selectedColors.findIndex(c => !c);
				self.selectedColors[index] = { r, g, b };
			}
		},
		removeColor(index) {
			if (
				self.isReady
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
				if (self.mixedColorString !== self.todaysChallenge.rgbString) {
					self.countDown(3);
				}
			}
		},
	}));

export default RootModel.create();