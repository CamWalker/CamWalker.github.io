export default class RGB_RYB {
  static mixRYB(...colors) {
    function sumColor(summedColors, nextColor) {
      return summedColors.map(
        (summedColor, i) => nextColor.pRYB[i] + summedColor,
      );
    }
    
    const mixedRYB = colors.reduce(sumColor, [0, 0, 0]).map(c => Math.floor(c/colors.length));
    
    const newColor = new RGB_RYB(0, 0, 0);
    newColor.setRYB(...mixedRYB);
    return newColor;
  }

	static mixRGB(...colors) {
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
			const whiteVal = Math.min(...color.pRGB);
			whiteParts.push([whiteVal, whiteVal, whiteVal]);
			colorParts.push(color.pRGB.map(val => val - whiteVal));
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
    
    const newColor = new RGB_RYB(0, 0, 0);
    newColor.setRGB(...averagedColor);
    return newColor;
  }

	static mixWhite(color, colorToWhiteProportion) {
		color.pRGB.map(c => (c * colorToWhiteProportion + 255) / (colorToWhiteProportion + 1))
	}
  
  static getHex(colors) {
    // Create the hex code for the array.
		var szColor = "";
		var szOne   = colors[0].toString(16);
		var szTwo   = colors[1].toString(16);
		var szThr   = colors[2].toString(16);
		
		if (szOne.length === 1) szColor += "0" + szOne; else szColor += szOne;
		if (szTwo.length === 1) szColor += "0" + szTwo; else szColor += szTwo;
		if (szThr.length === 1) szColor += "0" + szThr; else szColor += szThr;
		
		return(szColor);
  }
  
  constructor(hex) {
		if (hex[0] === '#') {
			hex = hex.slice(1);
		}
    const hexR = hex[0] + hex[1];
    const hexG = hex[2] + hex[3];
    const hexB = hex[4] + hex[5];
    function toDecimal(hex) { return parseInt(hex, 16); }
    
    this.setRGB(
      toDecimal(hexR),
      toDecimal(hexG),
      toDecimal(hexB),
    )
  }
  
  setRGB(iRed, iGreen, iBlue) {
    this.pRGB = [iRed, iGreen, iBlue];

		// Remove the white from the color
		var iWhite = Math.min(iRed, iGreen, iBlue);
    
		
		iRed -= iWhite;
		iGreen -= iWhite;
		iBlue -= iWhite;
		
		var iMaxGreen = Math.max(iRed, iGreen, iBlue);
		
		// Get the yellow out of the red+green
		
		var iYellow = Math.min(iRed, iGreen);
		
		iRed   -= iYellow;
		iGreen -= iYellow;
		
		// If this unfortunate conversion combines blue and green, then cut each in half to
		// preserve the value's maximum range.
		if (iBlue > 0 && iGreen > 0) {
			iBlue /= 2;
			iGreen /= 2;
		}
		
		// Redistribute the remaining green.
		iYellow += iGreen;
		iBlue += iGreen;
		
		// Normalize to values.
		var iMaxYellow = Math.max(iRed, iYellow, iBlue);
		
		if (iMaxYellow > 0) {
			const iN = iMaxGreen / iMaxYellow;
			iRed *= iN;
			iYellow *= iN;
			iBlue *= iN;
		}
		
		// Add the white back in.
		iRed += iWhite;
		iYellow += iWhite;
		iBlue += iWhite;
		
		this.pRYB = [
      Math.floor(iRed),
      Math.floor(iYellow),
      Math.floor(iBlue),
    ];
  }
  
  setRYB(iRed, iYellow, iBlue) {
		// Save the RYB
		this.pRYB = [iRed, iYellow, iBlue];
		
		// Remove the whiteness from the color.
		var iWhite = Math.min(iRed, iYellow, iBlue);
		
		iRed -= iWhite;
		iYellow -= iWhite;
		iBlue -= iWhite;

		var iMaxYellow = Math.max(iRed, iYellow, iBlue);

		// Get the green out of the yellow and blue
		var iGreen = Math.min(iYellow, iBlue);
		
		iYellow -= iGreen;
		iBlue -= iGreen;

		if (iBlue > 0 && iGreen > 0) {
			iBlue  *= 2.0;
			iGreen *= 2.0;
		}
		
		// Redistribute the remaining yellow.
		iRed += iYellow;
		iGreen += iYellow;

		// Normalize to values.
		var iMaxGreen = Math.max(iRed, iGreen, iBlue);
		
		if (iMaxGreen > 0) {
			var iN = iMaxYellow / iMaxGreen;
			
			iRed   *= iN;
			iGreen *= iN;
			iBlue  *= iN;
		}
		
		// Add the white back in.
		iRed += iWhite;
		iGreen += iWhite;
		iBlue += iWhite;

		// Save the RGB
		this.pRGB = [Math.floor(iRed), Math.floor(iGreen), Math.floor(iBlue)];
	}
  
  get hexRGB() {
    return `#${RGB_RYB.getHex(this.pRGB)}`;
  }
  
  get hexRYB() {
    return `#${RGB_RYB.getHex(this.pRYB)}`;
  }
  
  get luminance()	{
		return Math.floor(0.2126 * this.pRgb[0] + 0.7152 * this.pRgb[1] + 0.0722 * this.pRgb[2])
	}
}