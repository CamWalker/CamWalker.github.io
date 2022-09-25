import React from 'react';
import { observer } from 'mobx-react-lite';
import Confetti from 'react-confetti'
import './Board.css';

const Board = ({ store }) => {
	return (
		<div className="board">
			<Confetti
				run={store.isWon}
				colors={store.confettiColors}
				recycle={false}
				tweenDuration={12000}
				numberOfPieces={500}
			/>
			<div className='wrapper'>
				<div className="main">
					<div className="main-top">
						<div className="submissions-container main-item">
							<div className="submissions">
								{store.submissions.map((color, i) => (
									<div key={i} className="submission" style={{ backgroundColor: color.rgbString }} />
								))}
								{Array(6 - store.submissions.length).fill('#FFFFFF').map((color, i) => (
									<div key={i} className="submission" style={{ backgroundColor: color }}>
										{store.submissions.length + i + 1}
									</div>
								))}
							</div>
						</div>
						<div className="mix-container main-item">
							<div className="mix-colors">
								<div
									className="mix-color"
									style={{
										backgroundColor: !store.isReady
											? '#CCC'
											: store.seconds !== 0 || store.isLost 
												? store.todaysChallenge.rgbString 
												: store.mixedColorString,
										color: (store.seconds === 0 && store.selectedColorsOnly.length === 0)
											? '#CCC'
											: '#FFF',
									}}
								>
									{!store.isReady ? (
										<div
											onClick={() => {
												store.setIsReady(true);
												store.countDown(3);
											}}
											className="start-button rainbow"
										>
											Start
										</div>
									) : (
										<div className='mix-color-text'>
											<span>{(
												store.isWon
												? 'Spectacular!'
												: store.isLost 
													? 'Better luck next time'
													: store.seconds === 0
														? store.selectedColorsOnly.length === 0 && 'Recreate the color'
														: 'Remember this color'
											)}</span>
											<span>
												{(store.seconds !== 0 && !store.isWon && !store.isLost) && store.seconds}
											</span>
										</div>
									)}
								</div>
							</div>
						</div>
						<div className="selected-container main-item">
							<div className="selected-colors">
								{
									store.selectedColors.map((color, i) => {
										if (!color) {
											return (
												<div key={i} className="selected-color" style={{ backgroundColor: '#CCCCCC' }} />
											);
										}
										return (
											<div
												className="selected-color"
												style={{ backgroundColor: `rgb(${color.rgb.join(', ')})`, cursor: 'pointer' }}
												onClick={() => store.removeColor(i)}
												key={i}
											>
												<svg fill="currentColor" x="0px" y="0px" viewBox="0 0 460.775 460.775">
													<path d="M285.08,230.397L456.218,59.27c6.076-6.077,6.076-15.911,0-21.986L423.511,4.565c-2.913-2.911-6.866-4.55-10.992-4.55  c-4.127,0-8.08,1.639-10.993,4.55l-171.138,171.14L59.25,4.565c-2.913-2.911-6.866-4.55-10.993-4.55  c-4.126,0-8.08,1.639-10.992,4.55L4.558,37.284c-6.077,6.075-6.077,15.909,0,21.986l171.138,171.128L4.575,401.505  c-6.074,6.077-6.074,15.911,0,21.986l32.709,32.719c2.911,2.911,6.865,4.55,10.992,4.55c4.127,0,8.08-1.639,10.994-4.55  l171.117-171.12l171.118,171.12c2.913,2.911,6.866,4.55,10.993,4.55c4.128,0,8.081-1.639,10.992-4.55l32.709-32.719  c6.074-6.075,6.074-15.909,0-21.986L285.08,230.397z" />
												</svg>
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
								{Array.from(store.inputColors).map((color) => (
									<div
										key={color.join()} 
										style={{ backgroundColor: `rgb(${color.join(', ')})` }}
										className="input-color"
										onClick={() => store.addColor(color)}
									/>
								))}
								<div
									className={`submit main-item ${store.canSubmit ? 'rainbow' : ''}`}
									disabled={!store.canSubmit}
									onClick={store.submit}
								>
									Enter
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default observer(Board);
