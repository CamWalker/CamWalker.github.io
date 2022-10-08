import React, { useEffect, useState } from 'react';
import './Clock.css';

const Clock = ({ getTime }) => {
	const [time, setTime] = useState(getTime(Date.now()));

	useEffect(() => {
		setInterval(() => {
			setTime(getTime(Date.now()));
		}, 1000);
	});

	return (
		<div className='clock'>
			<div className='stat-value'>{time}</div>
			<div className='stat-label'>Next challenge</div>
		</div>
	);
};

export default Clock;
