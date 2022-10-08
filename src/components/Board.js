import React from 'react';
import { observer } from 'mobx-react-lite';
import Confetti from 'react-confetti';
import Modal from './Modal/Modal';
import './Board.css';
import Toast from './Toast/Toast';
import Clock from './Clock/Clock';

const Board = ({ store }) => {
	const stats = store.stats;
	return (
		<div className="board">
			<Toast toastModel={store.toast} />
			<Confetti
				run={store.isWon}
				colors={store.confettiColors}
				recycle={false}
				tweenDuration={12000}
				numberOfPieces={500}
			/>
			<Modal
				title="How to Play"
				visible={store.showInstructions}
				onClose={() => {
					store.setShowInstructions(false);
					store.setHasStarted(true);
					store.countDown(3);
				}}
				body={[(
					<div className='how-step'>
						<div className='step-label'>
							<strong>Step 1</strong>
							<span>Remember the color</span>
						</div>
						<div className='step-instructions'>
							A color will be shown for 3 seconds, then hidden. Remember that color!
						</div>
						<div className='step-visual'>
							<div
								className="submission countdown-example"
							/>
						</div>
					</div>
				), (
					<div className='how-step'>
						<div className='step-label'>
							<strong>Step 2</strong>
							<span>Recreate the color</span>
						</div>
						<div className='step-instructions'>
							Fill all 10 color slots to mix a new color that matches the color you remembered <i>(hopefully!)</i>.
						</div>
						<div className='step-visual'>
							<div className='example-dots'>
								{Array(10).fill(null).map((v, i) => (
									<div key={i} className='example-dot' />
								))}
							</div>
							<div
								className="submission example-dot-mix"
							/>
						</div>
					</div>
				), (
					<div className='how-step'>
						<div className='step-label'>
							<strong>Step 3</strong>
							<span>Complete in 6 tries to win!</span>
						</div>
						<div className='step-instructions'>
							You get 6 guesses to match the color of the day. Come back each day for a new challenge.
						</div>
						<div className='step-visual'>
							{[
								'rgb(85, 51, 151)',
								'rgb(108, 75, 153)',
								'rgb(132, 99, 154)',
								'rgb(156, 112, 200)',
								'rgb(154, 88, 176)',
							].map((color, i) => (
								<div
									key={i}
									className="submission"
									style={{ backgroundColor: color }}
								/>
							))}
							<div
								className="submission"
								style={{ backgroundColor: '#FFF', border: '1px solid #CCC', color: '#CCC' }}
							>6</div>
						</div>
					</div>
				)]}
			/>
			<Modal
				title="Stats"
				visible={store.showStats}
				onClose={() => store.setShowStats(false)}
				footerLeft={<Clock getTime={store.getTimeUntilNextGame} />}
				actionText="Share"
				onActionClick={store.copyToClipboard}
			>
				<div className='stat-container'>
					{[
						{
							value: stats.playedCount, 
							label: 'Played',
						},
						{
							value: stats.wonPercent, 
							label: 'Win %',
						},
						{
							value: stats.averageGuesses, 
							label: 'Average Guesses',
						},
						{
							value: stats.todayStreak, 
							label: 'Current Streak',
						},
						{
							value: stats.longestStreak,
							label: 'Record Streak',
						},
					].map(({ value, label }) => (
						<div key={label} className='single-stat'>
							<div className='stat-value'>{value}</div>
							<div className='stat-label'>{label}</div>
						</div>
					))}
				</div>
				<div className='dist-container'>
					<div className='header-container'>
						<div className='header'>Distribution</div>
					</div>
					<div className='dist'>
						{stats.breakDown.map((count, index) => {
							const maxBar = Math.max(...stats.breakDown);
							return (
								<div key={index} className='dist-row'>
									<div className='dist-row-label'>{index + 1}</div>
									{count > 0 && (
										<div
											className='dist-row-bar'
										>
											<div
												className={`dist-row-bar-inner ${
													(store.isWon && store.submissions.length === index + 1) && (
														'rainbow'
													)
												}`}
												style={{
													width: `calc(${count / maxBar * 100}% - 16px)`,
												}}
											>
												{count}
											</div>
										</div>
									)}
								</div>
							)
						})}
					</div>
				</div>
			</Modal>
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
										backgroundColor: (
											(store.seconds !== 0 || store.isLost || store.isWon )
												? store.todayChallenge.rgbString 
												: store.mixedColorString
										),
										color: (store.seconds === 0 && store.selectedColorsOnly.length === 0 && !store.isLost && !store.isWon)
											? '#CCC'
											: '#FFF',
									}}
								>
									{!store.hasStarted ? (
										<div
											onClick={() => {
												store.setHasStarted(true);
												store.countDown(3);
											}}
											className="start-button rainbow"
										>
											Click<br />to<br />Start
										</div>
									) : (
										<div className='mix-color-text'>
											{(store.seconds !== 0 && !store.isWon && !store.isLost) && store.seconds}
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
												<div key={i} className="selected-color" />
											);
										}
										return (
											<div
												className="selected-color"
												onClick={() => store.removeColor(i)}
												key={i}
											>
												<div className='filled' style={{ backgroundColor: `rgb(${color.rgb.join(', ')})` }}>
													<svg fill="currentColor" x="0px" y="0px" viewBox="0 0 460.775 460.775">
														<path d="M285.08,230.397L456.218,59.27c6.076-6.077,6.076-15.911,0-21.986L423.511,4.565c-2.913-2.911-6.866-4.55-10.992-4.55  c-4.127,0-8.08,1.639-10.993,4.55l-171.138,171.14L59.25,4.565c-2.913-2.911-6.866-4.55-10.993-4.55  c-4.126,0-8.08,1.639-10.992,4.55L4.558,37.284c-6.077,6.075-6.077,15.909,0,21.986l171.138,171.128L4.575,401.505  c-6.074,6.077-6.074,15.911,0,21.986l32.709,32.719c2.911,2.911,6.865,4.55,10.992,4.55c4.127,0,8.08-1.639,10.994-4.55  l171.117-171.12l171.118,171.12c2.913,2.911,6.866,4.55,10.993,4.55c4.128,0,8.081-1.639,10.992-4.55l32.709-32.719  c6.074-6.075,6.074-15.909,0-21.986L285.08,230.397z" />
													</svg>
												</div>
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
