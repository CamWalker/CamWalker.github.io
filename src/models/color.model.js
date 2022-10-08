import { types } from 'mobx-state-tree';

const { model, optional, integer, array, late } = types;

const ColorModel = model('ColorModel', {
	r: optional(integer, 0),
	g: optional(integer, 0),
	b: optional(integer, 0),
	composition: array(late(() =>  ColorModel))
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
			
			return `#${szColor.toUpperCase()}`;
		},
		get rgb() {
			return [self.r, self.g, self.b];
		},
		get rgbString() {
			return `rgb(${self.rgb.join(', ')})`;
		},
		get compositionCounts() {
			const counts = {};
			self.composition.map(color => {
				if (!counts[color.rgbString]) {
					counts[color.rgbString] = 1;
				} else {
					counts[color.rgbString] += 1;
				}
			});
			return counts;
		},
	}));

export default ColorModel;
