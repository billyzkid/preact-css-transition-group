/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 *	Additional credit to the Author of rc-css-transition-group: https://github.com/yiminghe
 *	File originally extracted from the React source, converted to ES6 by https://github.com/developit
 */


import { h, Component, toChildArray } from 'preact';
import { getComponentBase, onlyChild, requestAnimationFrame } from './util';
import { addClass, removeClass } from './CSSCore';
import { addEndEventListener, removeEndEventListener } from './TransitionEvents';

export class CSSTransitionGroupChild extends Component {
	transition(animationType, finishCallback, timeout) {

		if (!timeout) {
			this.raiseTimeoutConsoleError(animationType);
		}

		let node = getComponentBase(this);

		let className = this.props.name[animationType] || this.props.name + '-' + animationType;
		let activeClassName = this.props.name[animationType + 'Active'] || className + '-active';
		let timer = null;

		if (this.endListener) {
			this.endListener();
		}

		this.endListener = (e) => {
			if (e && e.target!==node) return;

			clearTimeout(timer);
			removeClass(node, className);
			removeClass(node, activeClassName);
			removeEndEventListener(node, this.endListener);
			this.endListener = null;

			// Usually this optional callback is used for informing an owner of
			// a leave animation and telling it to remove the child.
			if (finishCallback) {
				finishCallback();
			}
		};

		if (timeout) {
			timer = setTimeout(this.endListener, timeout);
			this.transitionTimeouts.push(timer);
		} else {
			addEndEventListener(node, this.endListener);
		}

		addClass(node, className);

		// Need to do this to actually trigger a transition.
		this.queueClass(activeClassName);
	}

	raiseTimeoutConsoleError(type) {
		const timeoutType = type === 'enter' ?  'transitionEnterTimeout' : 'transitionLeaveTimeout';
		console.error(`${timeoutType} should be specified`);
	}

	queueClass(className) {
		this.classNameQueue.push(className);

		if (!this.rafHandle) {
			this.rafHandle = requestAnimationFrame(this.flushClassNameQueue);
		}
	}

	stop() {
		if (this.rafHandle) {
			this.classNameQueue.length = 0;
			this.rafHandle = null;
		}
		if (this.endListener) {
			this.endListener();
		}
	}

	flushClassNameQueue = () => {
		if (getComponentBase(this)) {
			addClass(getComponentBase(this), this.classNameQueue.join(' '));
		}
		this.classNameQueue.length = 0;
		this.rafHandle = null;
	};

	componentWillMount() {
		this.classNameQueue = [];
		this.transitionTimeouts = [];
	}

	componentWillUnmount() {
		this.classNameQueue.length = 0;
		this.rafHandle = null;
		this.transitionTimeouts.forEach((timeout) => {
			clearTimeout(timeout);
		});
	}

	componentWillEnter(done) {
		if (this.props.enter) {
			this.transition('enter', done, this.props.enterTimeout);
		}
		else {
			done();
		}
	}

	componentWillLeave(done) {
		if (this.props.leave) {
			this.transition('leave', done, this.props.leaveTimeout);
		}
		else {
			done();
		}
	}

	render() {
		return onlyChild(toChildArray(this.props.children));
	}
}
