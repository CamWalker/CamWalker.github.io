import React from 'react';
import './InputColor.css';

const InputColor = ({ color, onClick }) => (
	<div
		style={{ backgroundColor: color }}
		className="input-color"
		onClick={() => onClick(color)}
	/>
);

export default InputColor;
