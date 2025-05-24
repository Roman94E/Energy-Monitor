let CONFIG = {
    checkInterval: 1 * 1000,
    lambda_url: "",
};

let time;
let a_current, a_voltage, a_act_power, a_aprt_power, a_pf, a_freq;
let b_current, b_voltage, b_act_power, b_aprt_power, b_pf, b_freq;
let c_current, c_voltage, c_act_power, c_aprt_power, c_pf, c_freq;

function send_energy_data() {
    Shelly.call("Sys.GetStatus", { id: 0 }, function(sysResult) {
        time = sysResult.unixtime;

        Shelly.call("EM.GetStatus", { id: 0 }, function(switchResult) {
            a_current = switchResult['a_current'];
            a_voltage = switchResult['a_voltage'];
            a_act_power = switchResult['a_act_power'];
            a_aprt_power = switchResult['a_aprt_power'];
            a_pf = switchResult['a_pf'];
            a_freq = switchResult['a_freq'];
            b_current = switchResult['b_current'];
            b_voltage = switchResult['b_voltage'];
            b_act_power = switchResult['b_act_power'];
            b_aprt_power = switchResult['b_aprt_power'];
            b_pf = switchResult['b_pf'];
            b_freq = switchResult['b_freq'];
            c_current = switchResult['c_current'];
            c_voltage = switchResult['c_voltage'];
            c_act_power = switchResult['c_act_power'];
            c_aprt_power = switchResult['c_aprt_power'];
            c_pf = switchResult['c_pf'];
            c_freq = switchResult['c_freq'];

            let url = CONFIG.lambda_url + 
                'time=' + time + 
                '&a_current=' + a_current +
                '&a_voltage=' + a_voltage +
                '&a_act_power=' + a_act_power +
                '&a_aprt_power=' + a_aprt_power +
                '&a_pf=' + a_pf +
                '&a_freq=' + a_freq +
                '&b_current=' + b_current +
                '&b_voltage=' + b_voltage +
                '&b_act_power=' + b_act_power +
                '&b_aprt_power=' + b_aprt_power +
                '&b_pf=' + b_pf +
                '&b_freq=' + b_freq +
                '&c_current=' + c_current +
                '&c_voltage=' + c_voltage +
                '&c_act_power=' + c_act_power +
                '&c_aprt_power=' + c_aprt_power +
                '&c_pf=' + c_pf +
                '&c_freq=' + c_freq;

            Shelly.call("HTTP.GET", { "url": url }, function(result) {
                // Wait for the next interval to make the next call
                Timer.set(CONFIG.checkInterval, false, send_energy_data);
            });
        });
    });
}

// Start the first call
send_energy_data();
