import React from "react";
import './Button.css';

const Button = ({
	className,
	disabled = false,
	onClick,
	type = 'primary',
	children,
	style,
}) => {
	return (
		<div
			className={`button ${className} ${type}`}
			disabled={disabled}
			onClick={onClick}
			style={style}
		>
			{children}
		</div>
	)
};

export default Button;
