import { types } from 'mobx-state-tree';

const { model, string, optional, integer } = types;

const ToastModel = model('ToastModel', {
	text: optional(string, ''),
	ms: optional(integer, 0),
})
	.views(self => ({
			get visible() {
				return self.ms > 0;
			}
	}))
	.actions(self => ({
		setText(text) {
			self.text = text;
		},
		setMS(ms) {
			self.ms = ms;
		},
		show(text, ms) {
			self.setText(text);
			self.setMS(ms);
		},
		clear() {
			self.setText('');
			self.setMS(0);
		},
	}));

export default ToastModel;