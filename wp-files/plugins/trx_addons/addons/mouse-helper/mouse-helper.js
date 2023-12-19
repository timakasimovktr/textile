/* global jQuery */

(function() {

	"use strict";

	var requestAnimationFrame = trx_addons_request_animation_frame();

	var mouseX = null, mouseY = null,
		realX  = null, realY  = null,
		destX  = [0,0,0,0,0,0,0,0,0,0],		// Allow up to 10 helper parts to move
		destY  = [0,0,0,0,0,0,0,0,0,0];

	var mouse_helper_timeout  = 0,
		mouse_helper_target   = null,
		mouse_helper_last_target = null,
		mouse_helper_action      = '',
		mouse_helper_last_action = '',
		mouse_helper_callback = '',
		mouse_helper_axis     = 'xy',
		mouse_helper_delay    = 1,
		mouse_helper_smooth   = true;

	var mouse_helper_original_styles = [ {}, {}, {}, {}, {}, {}, {}, {}, {}, {} ];

	var $window               = jQuery( window ),
		$document             = jQuery( document ),
		$body                 = jQuery( 'body' ),
		$mouse_helper         = jQuery('.trx_addons_mouse_helper');

	if ( $mouse_helper.eq(0).hasClass( 'trx_addons_mouse_helper_smooth' ) ) {
		mouse_helper_smooth = true;
	}

	var $mouse_helper_targets,
		$mouse_helper_magnets;

	// Update links and values after the new post added
	$document.on( 'action.got_ajax_response', update_jquery_links );
	$document.on( 'action.init_hidden_elements', update_jquery_links );
	var first_run = true;
	function update_jquery_links(e) {
		if ( first_run && e && e.namespace == 'init_hidden_elements' ) {
			first_run = false;
			return; 
		}
		$mouse_helper_targets = jQuery('[data-mouse-helper]');
		$mouse_helper_magnets = jQuery('[data-mouse-helper-magnet]:not([data-mouse-helper-magnet="0"])');
	}
	update_jquery_links();


	// Init Mouse helper
	$document.on('action.init_trx_addons', function() {

		if ( TRX_ADDONS_STORAGE['mouse_helper'] > 0 && $mouse_helper.length > 0 && requestAnimationFrame ) {

			$mouse_helper.each( function( idx ) {
				mouse_helper_original_styles[ idx ] = {
					blend_mode:	$mouse_helper.eq(idx).css( 'mix-blend-mode' ),
					color:		$mouse_helper.eq(idx).css( 'color' ),
					bg_color:	$mouse_helper.eq(idx).css( 'background-color' ),
					bd_color:	$mouse_helper.eq(idx).css( 'border-color' ),
					bd_width:	$mouse_helper.eq(idx).css( 'border-width' ),
					bd_style:	$mouse_helper.eq(idx).css( 'border-style' )
				};
			} );

			mouse_helper_delay = TRX_ADDONS_STORAGE['mouse_helper_delay'];

			var pointermove_allowed = false;

			$document
				.on( 'mousemove pointermove', function(e) {
					if ( e.originalEvent.type == 'pointermove' ) {
						pointermove_allowed = true;
					}
					if ( e.originalEvent.type == 'mousemove' && pointermove_allowed ) {
						return;
					}
					trx_addons_mouse_helper_get_state(e);
					if ( mouse_helper_callback && typeof window[mouse_helper_callback] == 'function' ) {
						window[mouse_helper_callback]( 'mousemove', $mouse_helper, mouse_helper_target, e );
					} else if ( typeof window['trx_addons_mouse_helper_callback_' + mouse_helper_action] == 'function' ) {
						window['trx_addons_mouse_helper_callback_' + mouse_helper_action]( 'mousemove', $mouse_helper, mouse_helper_target, e );
					}
					if ( mouse_helper_action == 'highlight' && mouse_helper_target ) {
						var targetOffset = mouse_helper_target.offset(),
							targetX = targetOffset.left - trx_addons_window_scroll_left(),
							targetY = targetOffset.top - trx_addons_window_scroll_top(),
							size = parseFloat( mouse_helper_target.css('background-size').split(' ')[0] ) / 2;
						mouse_helper_target.css( 'background-position', ( mouseX - targetX - size) + 'px ' + ( mouseY - targetY - size ) + 'px' );
					}
					if ( trx_addons_window_width() >= TRX_ADDONS_STORAGE['mobile_breakpoint_mousehelper_off'] ) {
						if ( mouse_helper_delay < 2 ) {
							destX.fill( mouseX );
							destY.fill( mouseY );
							$mouse_helper.css("transform", "translate(" + destX[0] + "px," + destY[0] + "px)");
						}
						if ( mouseX > trx_addons_window_width() - 100 ) {
							if ( ! $mouse_helper.hasClass( 'trx_addons_mouse_helper_left' ) ) {
								$mouse_helper.addClass( 'trx_addons_mouse_helper_left' );
							}
						} else {
							if ( $mouse_helper.hasClass( 'trx_addons_mouse_helper_left' ) ) {
								$mouse_helper.removeClass( 'trx_addons_mouse_helper_left' );
							}
						}
						if ( mouseY > trx_addons_window_height() - 100 ) {
							if ( ! $mouse_helper.hasClass( 'trx_addons_mouse_helper_top' ) ) {
								$mouse_helper.addClass( 'trx_addons_mouse_helper_top' );
							}
						} else {
							if ( $mouse_helper.hasClass( 'trx_addons_mouse_helper_top' ) ) {
								$mouse_helper.removeClass( 'trx_addons_mouse_helper_top' );
							}
						}
						// Check magnets
						trx_addons_mouse_helper_check_magnets();
					}
				} )

				

				.on( "mousedown swiper_touch_start", '[data-mouse-helper]', function(e) {
					var $self = jQuery(this);
					$mouse_helper.addClass('trx_addons_mouse_helper_click');
					mouse_helper_callback = $self.data( 'mouse-helper-callback' );
					if ( mouse_helper_callback === undefined ) {
						mouse_helper_callback = '';
					}
					if ( mouse_helper_callback && typeof window[mouse_helper_callback] == 'function' ) {
						window[mouse_helper_callback]( 'mousedown', $mouse_helper, $self, e );
					} else if ( typeof window['trx_addons_mouse_helper_callback_' + mouse_helper_action] == 'function' ) {
						window['trx_addons_mouse_helper_callback_' + mouse_helper_action]( 'mousedown', $mouse_helper, $self, e );
					}
				} )

				.on( "mouseup swiper_touch_end", '[data-mouse-helper]', function(e) {
					var $self = jQuery(this);
					$mouse_helper.removeClass('trx_addons_mouse_helper_click');
					mouse_helper_callback = $self.data( 'mouse-helper-callback' );
					if ( mouse_helper_callback === undefined ) {
						mouse_helper_callback = '';
					}
					if ( mouse_helper_callback && typeof window[mouse_helper_callback] == 'function' ) {
						window[mouse_helper_callback]( 'mouseup', $mouse_helper, $self, e );
					} else if ( typeof window['trx_addons_mouse_helper_callback_' + mouse_helper_action] == 'function' ) {
						window['trx_addons_mouse_helper_callback_' + mouse_helper_action]( 'mouseup', $mouse_helper, $self, e );
					}
				} );

			var mouse_helper_links = trx_addons_apply_filters(
										'trx_addons_filter_mouse_helper_links',
										'a,button,input[type="button"],input[type="submit"],input[type="reset"]'
									);
			$document
				.on( "mouseenter", mouse_helper_links, function(e) {
					$mouse_helper.addClass( "trx_addons_mouse_helper_over_link" );

				} )
				.on( "mouseleave", mouse_helper_links, function(e) {
					$mouse_helper.removeClass( "trx_addons_mouse_helper_over_link" );
				} );

			var mouse_helper_reset = function() {
				$mouse_helper.eq(0).addClass('trx_addons_mouse_helper_reset');
				setTimeout( function() {
						$mouse_helper.eq(0).removeClass('trx_addons_mouse_helper_reset');
					},     $mouse_helper.eq(0).hasClass( 'trx_addons_mouse_helper_with_icon' )
						|| $mouse_helper.eq(0).hasClass( 'trx_addons_mouse_helper_with_text' )
						|| $mouse_helper.eq(0).hasClass( 'trx_addons_mouse_helper_with_image' )
						|| $mouse_helper.eq(0).hasClass( 'trx_addons_mouse_helper_with_layout' )
						|| ( mouse_helper_target && (
							mouse_helper_target.data( 'mouse-helper-icon' )
							|| mouse_helper_target.data( 'mouse-helper-text' )
							|| mouse_helper_target.data( 'mouse-helper-image' )
							|| mouse_helper_target.data( 'mouse-helper-layout' )
							) )
							? ( mouse_helper_smooth ? 500 : 0 )
							: ( mouse_helper_smooth ? 50 : 0 )
				);
				$mouse_helper.eq(0)
					.attr( 'class', trx_addons_chg_class_by_prefix( $mouse_helper.attr( 'class' ), 'trx_addons_mouse_helper_over_element_', '' ) );
				var $inner_elements = $mouse_helper.eq(0).find('.trx_addons_mouse_helper_image,.trx_addons_mouse_helper_text,.trx_addons_mouse_helper_icon,.trx_addons_mouse_helper_layout');
				if ( $inner_elements.length > 0 ) {
					if ( true ) {
						// Abrupt remove of inner elements
						$inner_elements.remove();
					} else {
						// Smooth remove of inner elements
						$inner_elements
							.addClass('trx_addons_mouse_helper_reset_item')
							.animate( {
									opacity: 0,
									height: 0,
									width: 0
								},
								mouse_helper_smooth ? 500 : 0,
								function() {
									var $self = jQuery(this);
									if ( $self.hasClass('trx_addons_mouse_helper_reset_item') ) {
										$self.remove();
									}
								} );
					}
				}
				$mouse_helper
					.removeClass(
						'trx_addons_mouse_helper_active'
						+ ' trx_addons_mouse_helper_hide'
						+ ' trx_addons_mouse_helper_with_icon'
						+ ' trx_addons_mouse_helper_with_text'
						+ ' trx_addons_mouse_helper_with_text_round'
						+ ' trx_addons_mouse_helper_with_image'
						+ ' trx_addons_mouse_helper_with_layout'
					)
					.toggleClass( 'trx_addons_mouse_helper_centered', TRX_ADDONS_STORAGE['mouse_helper_centered'] > 0 );
				$mouse_helper.each( function( idx ) {
					$mouse_helper.eq(idx).css( {
						'mix-blend-mode': mouse_helper_original_styles[idx].blend_mode,
						'color': mouse_helper_original_styles[idx].color,
						'background-color': mouse_helper_original_styles[idx].bg_color,
						'border-color': mouse_helper_original_styles[idx].bd_color,
						'border-width': mouse_helper_original_styles[idx].bd_width,
						'border-style': mouse_helper_original_styles[idx].bd_style
					} );
				} );
				if ( mouse_helper_callback && typeof window[mouse_helper_callback] == 'function' ) {
					window[mouse_helper_callback]( 'reset', $mouse_helper, mouse_helper_last_target, null );
					mouse_helper_callback = '';
				} else if ( typeof window['trx_addons_mouse_helper_callback_' + mouse_helper_last_action] == 'function' ) {
					window['trx_addons_mouse_helper_callback_' + mouse_helper_last_action]( 'reset', $mouse_helper, mouse_helper_last_target, e );
				}
			};

			var mouse_helper_move = function() {
				cancelAnimationFrame(mouse_helper_move);
				if ( trx_addons_window_width() >= TRX_ADDONS_STORAGE['mobile_breakpoint_mousehelper_off'] && null !== mouseX && mouse_helper_delay > 1 ) {
					$mouse_helper.each( function( idx ) {
						if ( destX[idx] != mouseX || destY[idx] != mouseY ) {
							if ( $mouse_helper.eq( idx ).hasClass( 'trx_addons_mouse_helper_permanent' ) || $mouse_helper.eq( idx ).hasClass( 'trx_addons_mouse_helper_active' ) ) {
								var delay = ( $mouse_helper.eq( idx ).data( 'delay' ) || 0 ) * 1 + mouse_helper_delay * 1;
								destX[idx] += ( mouseX - destX[idx] ) / delay;
								destY[idx] += ( mouseY - destY[idx] ) / delay;
							} else {
								destX[idx] = mouseX;
								destY[idx] = mouseY;
							}
							$mouse_helper.eq( idx ).css("transform", "translate(" + destX[idx] + "px," + destY[idx] + "px)");
						}
					} );
				}
				requestAnimationFrame(mouse_helper_move);
			};
			requestAnimationFrame(mouse_helper_move);


			// Get current state
			function trx_addons_mouse_helper_get_state(e) {
				if ( e.clientX === undefined ) return;
				realX = e.clientX + trx_addons_window_scroll_left();
				realY = e.clientY + trx_addons_window_scroll_top();
				if ( mouse_helper_axis.indexOf('x') != -1 ) mouseX = e.clientX;
				if ( mouse_helper_axis.indexOf('y') != -1 ) mouseY = e.clientY;
			}


			// Check magnets
			function trx_addons_mouse_helper_check_magnets() {

				$mouse_helper_magnets.each( function() {

					var item  = jQuery(this),
						inner = item.children(),
						koef = item.data('mouse-helper-magnet-velocity') ? item.data('mouse-helper-magnet-velocity') : 1,
						delta = item.data('mouse-helper-magnet') * koef;

					var data, cx, cy, iw, ih, ix, iy, near; //position variables

					requestAnimationFrame(control_item);

					function control_item() {
						var off = item.offset();
						cx = realX;
						cy = realY;
						iw = item.width();
						ih = item.height();
						ix = off.left + iw / 2;
						iy = off.top + ih / 2;
						near = Math.abs(ix - cx) < iw * koef && Math.abs(iy - cy) < ih * koef;

						if (near) {
							! item.hasClass('trx_addons_mouse_helper_near') && move_item();
							requestAnimationFrame(control_item);
						} else {
							item.hasClass('trx_addons_mouse_helper_near') && reset_item();
						}
					}

					function move_item() {

						item.addClass('trx_addons_mouse_helper_near');

						var d  = get_closest_position(),
							dx = d.x,
							dy = d.y,
							nx = 0,
							ny = 0;

						transform_item();

						function transform_item() {
							var d = get_closest_position();
							nx += (d.x - dx) / 5;
							ny += (d.y - dy) / 5;

							nx.toFixed(2) !== dx.toFixed(2) &&
								inner.css({
									'transition': 'none',
									'transform':  'translate3d(' + nx + 'px, ' + ny + 'px, 0)'
								});

							dx = nx;
							dy = ny;

							requestAnimationFrame(function () {
								near && transform_item();
							});
						}

						function get_closest_position() {
							return {
								x: Math.abs(cx - ix) < delta ? cx - ix : delta * (cx - ix) / Math.abs(cx - ix),
								y: Math.abs(cy - iy) < delta ? cy - iy : delta * (cy - iy) / Math.abs(cy - iy)
							};
						}
					}

					function reset_item() {

						item.removeClass('trx_addons_mouse_helper_near');

						inner
							.css({
								'transition': 'transform 0.5s',
								'transform':  'translate3d(0px, 0px, 0px)'
							})
							.one( typeof window.trx_addons_transition_end != 'undefined' ? trx_addons_transition_end() : 'transitionend', function () {
								inner.css({
									'transition': 'none'
								});
							});
					}
				} );
			}
		}
	} );


	// Add Mouse helper to the TOC menu
	$document.on( 'action.build_page_toc', function() {
		jQuery( '#toc_menu .toc_menu_item' ).each( function() {
			if ( trx_addons_apply_filters( 'trx_addons_filter_mouse_helper_on_toc', TRX_ADDONS_STORAGE['mouse_helper'] > 0 ) ) {
				var $self = jQuery(this),
					title = $self.attr( 'title' ) || $self.find('.toc_menu_description_title').text();
				$self.attr( {
					'data-mouse-helper': 'hover',
					'data-mouse-helper-axis': 'y',
					'data-mouse-helper-text': TRX_ADDONS_STORAGE['msg_mouse_helper_anchor'] + ( title ? ' ' + title : '' )
				} );
			}
		} );
	} );

})();