import React, { useEffect, useState } from 'react';
import Chance from 'chance';
import Confetti from 'react-confetti'
import RGB_RYB from './RGB_RYB';
import './Board.css';

// Default State
const defaultState = [
	['#D81210', 0],
	['#FFDA01', 0],
	['#005AD3', 0],
	['#FFFFFF', 0],
];

const maxSelection = 10;
const today = new Date();
const seed = today.getMilliseconds();

function getDailyChallenge() {
	// const seed = `${today.getUTCFullYear}${today.getUTCMonth}${today.getUTCDate}`;
	const chance = new Chance(seed);
	const colorsToMix = Array(maxSelection).fill(null).map(() => {
		const index = chance.integer({ min: 0, max: 3 });
		return new RGB_RYB(defaultState[index][0]);
	});
	return RGB_RYB.mixRGB(...colorsToMix);
}
const dailyChallenge = getDailyChallenge();

const Board = () => {
	const [isReady, setIsReady] = useState(false);
	const [seconds, setSeconds] = useState(0);
	const [submissions, setSubmissions] = useState([]);
	const [colors, setColors] = useState(new Map(defaultState));
	const isWon = submissions.length > 0 
		&& submissions[submissions.length - 1] === dailyChallenge.hexRGB;
	const isLost = submissions.length === 6 && !isWon;

	// Count down to 0
	useEffect(() => {
		if (seconds !== 0) {
			setTimeout(() => {
				setSeconds(seconds - 1);
			}, 1000);
		}
	}, [seconds]);

	function getSelectedColors() {
		const selectedColors = [];
		Array.from(colors).forEach(([color, count]) => {
			const RYB = new RGB_RYB(color);
			for (let i = 0; i < count; i++) {
				selectedColors.push(RYB);
			}
		});
		return selectedColors;
	}

	const selectedColors = getSelectedColors();

	function addColor(hex) {
		if (
			selectedColors.length < maxSelection
			&& isReady
			&& !isWon
			&& !isLost
		) {
			const newColors = new Map(colors);
			const colorCount = newColors.get(hex);
			newColors.set(hex, colorCount + 1);
			setColors(newColors);
		}
	}

	function removeColor(hex) {
		if (
			isReady
			&& !isWon
			&& !isLost
		) {
			hex = hex.toUpperCase();
			const newColors = new Map(colors);
			const colorCount = newColors.get(hex);
			if (colorCount > 0) {
				newColors.set(hex, colorCount - 1);
			}
			setColors(newColors);
		}
	}

	function mixColors() {
		if (selectedColors.length > 0) {
			const mixedColor = RGB_RYB.mixRGB(...selectedColors)
			return mixedColor.hexRGB;
		}

		return '#FFFFFF';
	}

	const mixedColors = mixColors();

	function submit() {
		if (!isWon && selectedColors.length === maxSelection && submissions.length < 6) {
			const newSubmissions = [].concat(submissions);
			newSubmissions.push(mixedColors);
			setSubmissions(newSubmissions);
			if (mixedColors !== dailyChallenge.hexRGB) {
				setSeconds(3);
			}
		}
	}

	const selectedColorsDisplay = [].concat(
		selectedColors.map(v => v.hexRGB),
		Array(maxSelection - selectedColors.length).fill(null),
	);

	return (
		<div className="board">
			<Confetti
				run={isWon}
				colors={[dailyChallenge.hexRGB, ...defaultState.map(([color]) => RGB_RYB.mixRYB(new RGB_RYB(color), dailyChallenge, dailyChallenge, dailyChallenge).hexRGB )]}
				recycle={false}
				tweenDuration={12000}
				numberOfPieces={500}
			/>
			<div className="main">
				<div className="main-top">
					<div className="submissions-container main-item">
						<div className="submissions">
							{submissions.map((color, i) => (
								<div key={i} className="submission" style={{ backgroundColor: color }} />
							))}
							{Array(6 - submissions.length).fill('#FFFFFF').map((color, i) => (
								<div key={i} className="submission" style={{ backgroundColor: color }}>
									{submissions.length + i + 1}
								</div>
							))}
						</div>
					</div>
					<div className="mix-container main-item">
						<div className="mix-colors">
							<div
								className="mix-color"
								style={{
									backgroundColor: !isReady
									? '#CCC'
									: seconds !== 0 || isLost 
										? dailyChallenge.hexRGB 
										: mixedColors,
									color: (seconds === 0 && selectedColors.length === 0)
											? '#CCC' 
											: '#FFF',
								}}
							>
								{!isReady ? (
									<div
										onClick={() => {
											setIsReady(true);
											setSeconds(3);
										}}
										className="start-button rainbow"
									>
										Start
									</div>
								) : (
									<div className='mix-color-text'>
										<span>{(
											isWon
											? 'Spectacular!'
											: isLost 
												? 'Better luck next time'
												: seconds === 0
													? selectedColors.length === 0 && 'Recreate the color'
													: 'Remember this color'
										)}</span>
										<span>
											{(seconds !== 0 && !isWon && !isLost) && seconds}
										</span>
									</div>
								)}
							</div>
						</div>
					</div>
					<div className="selected-container main-item">
						<div className="selected-colors">
							{
								selectedColorsDisplay.map((color, i) => {
									if (!color) {
										return (
											<div key={i} className="selected-color" style={{ backgroundColor: '#CCCCCC' }} />
										);
									}
									return (
										<div
											className="selected-color"
											style={{ backgroundColor: color, cursor: 'pointer' }}
											onClick={() => removeColor(color)}
											key={i}
										>
											<div>+</div>
										</div>
									)
								})
							}
						</div>
					</div>
				</div>
				<div className="main-top">
					<div className="input-container main-item">
						<div className="input-colors">
							{Array.from(colors).map(([color, count]) => (
								<div
									key={color} 
									style={{ backgroundColor: color }}
									className="input-color"
									onClick={() => addColor(color)}
								/>
							))}
							<div
								className={`submit main-item ${!(isWon || isLost || selectedColors.length !== maxSelection) ? 'rainbow' : ''}`}
								disabled={isWon || isLost || selectedColors.length !== maxSelection}
								onClick={submit}
							>
								Enter
							</div>
						</div>
					</div>
					
				</div>
			</div>
		</div>
	)
}

export default Board;
