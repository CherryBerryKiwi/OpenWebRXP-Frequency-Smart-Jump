/*
 * Plugin: frequency_smart_jump
 *
 * Smart frequency jump for OpenWebRX+
 *
 * - If entered frequency belongs to an existing profile:
 *   load the nearest-center profile first, then tune to the exact frequency.
 *
 * - If no profile matches:
 *   perform normal far frequency jump.
 *
 * Requires:
 *   utils plugin
 *   Allow users to change center frequency
 */

Plugins.frequency_smart_jump = {};
Plugins.frequency_smart_jump.no_css = true;


Plugins.frequency_smart_jump.init = async function () {

    if (!Plugins.isLoaded('utils', 0.1)) {
        await Plugins.load(
            'https://0xaf.github.io/openwebrxplus-plugins/receiver/utils/utils.js'
        );

        if (!Plugins.isLoaded('utils', 0.1)) {
            console.error(
                'Plugin frequency_smart_jump requires utils plugin'
            );
            return false;
        }
		console.log("Frequency Smart Jump - Written by ChatGPT with special support from Pham Hoang Thi - hoangthisd@gmail.com");
    }


    function findProfile(freq) {

        let result = null;
        let bestDistance = Infinity;

        $('#openwebrx-sdr-profiles-listbox option').each(function () {

            let value = $(this).val();

            if (!value)
                return;


            /*
             * Example:
             * rtlsdr|0144_0146
             */

            let parts = value.split('|');

            if (parts.length !== 2)
                return;


            let range = parts[1].split('_');

            if (range.length !== 2)
                return;


            let low = parseInt(range[0]) * 1000;
            let high = parseInt(range[1]) * 1000;


            if (isNaN(low) || isNaN(high))
                return;


            low *= 1000;
            high *= 1000;


            if (freq >= low && freq <= high) {

                let center = (low + high) / 2;

                let distance = Math.abs(freq - center);

                if (distance < bestDistance) {
                    bestDistance = distance;
                    result = this;
                }
            }

        });

        return result;
    }


    function loadProfile(option) {

        return new Promise(resolve => {

            let value = $(option).val();

            console.log(
                'frequency_smart_jump loading profile:',
                value
            );


            $(document).one(
                'event:profile_changed',
                function () {
                    setTimeout(resolve, 300);
                }
            );


            $('#openwebrx-sdr-profiles-listbox')
                .val(value)
                .trigger('change');

        });
    }


    function tuneExactFrequency(freq) {

        let panel =
            $('#openwebrx-panel-receiver')
            .data('panel');


        if (!panel) {
            console.log(
                'frequency_smart_jump: panel unavailable'
            );
            return;
        }


        /*
         * OpenWebRX+ frequency model:
         * actual = center_freq + offset_frequency
         *
         * Keep profile center and tune demodulator offset.
         */
        let offset =
            freq - panel.center_freq;


      /*  console.log(
            'frequency_smart_jump tuning:',
            {
                target: freq,
                center: panel.center_freq,
                offset: offset
            }
        );
		*/


        let demod =
            panel.getDemodulator ?
            panel.getDemodulator() :
            panel.demodulator;


        if (demod &&
            typeof demod.set_offset_frequency === 'function') {

            demod.set_offset_frequency(offset);

        } else {

            console.log(
                'frequency_smart_jump: fallback websocket'
            );

            let key =
                $('#openwebrx-panel-receiver')
                .demodulatorPanel()
                .getMagicKey();


            ws.send(JSON.stringify({
                type: 'setfrequency',
                params: {
                    frequency: freq,
                    key: key
                }
            }));
        }

    }



    Plugins.utils.wrap_func(
        'set_offset_frequency',

        function (orig, thisArg, args) {

            let offset = Math.round(args[0]);

            if (typeof offset === 'undefined')
                return true;


            if (
                offset > bandwidth / 2 ||
                offset < -bandwidth / 2
            ) {

                let freq = center_freq + offset;

                let profile = findProfile(freq);


                if (profile) {

                    loadProfile(profile)
                    .then(function () {
                        tuneExactFrequency(freq);
                    });

                } else {

                    tuneExactFrequency(freq);

                }


                return false;
            }


            return true;

        },

        null,

        Demodulator.prototype
    );


    return true;
};
