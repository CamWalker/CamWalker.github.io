import React, { useEffect, useState } from "react";
import { observer } from 'mobx-react-lite';
import './Modal.css';

const Modal = ({
	title,
	visible,
	onClose,
	children,
	body,
	footerLeft,
	actionText,
	onActionClick,
}) => {
	const [shouldRender, setShouldRender] = useState(visible);
	const hasPages = Array.isArray(body) && body.length > 0;
	const [page, setPage] = useState(0)
	const hasNextPage = hasPages && page < body.length - 1;
	
	useEffect(() => {
		if (visible) {
			setShouldRender(visible);
		} else {
			setTimeout(() => {
				setShouldRender(visible);
			}, 300)
		}
	}, [visible]);

	return (
		<div className={`modal-wrapper ${shouldRender && 'visible'}`} onClick={onClose}>
			<div className={`modal-body ${!visible && 'invisible'}`} onClick={(e) => e.stopPropagation()}>
				<div>
					<div className="header-container">
						<h1 className="header">
							{title}
						</h1>
					</div>
					<div className="modal-children">
						{hasPages ? (
							body[page]
						) : body && (
							body
						)}
						{children}
					</div>
					<div className='modal-footer'>
						{footerLeft || <div />}
						{onActionClick && (
							<div className='share-button rainbow-reverse' onClick={onActionClick}>
								{actionText}
							</div>
						)}
						{hasPages && hasNextPage && (
							<div className='share-button rainbow-reverse' onClick={() => setPage(page + 1)}>
								Next
							</div>
						)}
						{hasPages && !hasNextPage && (
							<div className='share-button rainbow-reverse' onClick={onClose}>
								Start
							</div>
						)}
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