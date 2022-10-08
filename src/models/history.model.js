import { types } from 'mobx-state-tree';
import ColorModel from './color.model';

const { model, array, optional, boolean, integer } = types;

const ONE_DAY = 1000 * 60 * 60 * 24;

const HistoryModel = model('HistoryModel', {
	todayTimestamp: integer,
	hasStarted: optional(boolean, false),
	submissions: array(ColorModel),
	todayChallenge: optional(ColorModel, {}),
})
.views(self => ({
	get isWon() {
		if (self.submissions.length > 6 || self.submissions.length <= 0) return false;
		const lastSubmission = self.submissions[self.submissions.length - 1];
		return (
			self.todayChallenge.r === lastSubmission.r
			&& self.todayChallenge.g === lastSubmission.g
			&& self.todayChallenge.b === lastSubmission.b
		);
	},
	get submissionCount() {
		return self.submissions.length;
	},
	wasOneDayBefore(timestamp) {
		return timestamp - ONE_DAY === self.todayTimestamp;
	},
}));

export default HistoryModel;
