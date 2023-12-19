jQuery( document ).on(
	'action.init_hidden_elements', function(e, cont) {
		"use strict";
        //Underline Animation Big
        //+++++++++++++++++++
		
        /*
        jQuery(
            ''
        ).addClass( 'underline_anim_big' );
		*/

        jQuery(window).scroll(function() {
            jQuery( '.underline_anim_big:not(.underline_do_hover)' ).each( function() {
                var item = jQuery(this);
                if ( item.offset().top < jQuery( window ).scrollTop() + jQuery( window ).height() - 80 ) {
                    item.addClass( 'underline_do_hover' );
                }
            } );
        });

	}
);