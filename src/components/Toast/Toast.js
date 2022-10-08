import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import './Toast.css';

const Toast = ({ toastModel: { text, ms, visible, clear } }) => {
	useEffect(() => {
		if (ms > 0) {
			setTimeout(() => {
				clear();
			}, ms);
		}
	}, [ms, clear]);
	
	return (
		<div className='toast-container' onClick={clear}>
			{visible && <div className='toast rainbow'>{text}</div>}
		</div>
	);
};

export default observer(Toast);
