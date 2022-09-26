import React, { Children } from "react";
import { observer } from 'mobx-react-lite';
import './Modal.css';

const Modal = ({ title, visible, onClose, children }) => {
	// if (!visible) return null;

	return (
		<div className={`modal-wrapper ${visible && 'visible'}`} onClick={onClose}>
			<div className="modal-body">
				<div>
					<div className="">
						<h1 className="header">
							{title}
						</h1>
					</div>
					<div>
						{children}
					</div>
				</div>
				<div className="modal-close" onClick={onClose}>
					<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" className="game-icon">
						<path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
					</svg>
				</div>
			</div>
		</div>
	);
}

export default observer(Modal);