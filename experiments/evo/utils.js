export function logNormalScalingFactor(skew = 2) {
    return Math.exp((Math.random() - 0.5) / skew);
}

export function mutateColorValue(colorValue) {
    // Randomly adjust color value by up to 20 in either direction
    let newValue = colorValue + (logNormalScalingFactor(1) * 50 - 50);
    // Ensure color value stays within 0-255 range
    newValue = Math.max(newValue, 0);
    newValue = Math.min(newValue, 255);
    return Math.round(newValue);
}

export function coinFlip(opt1, opt2, odds = 0.5) {
    if(Math.random() < odds) return opt1;
    else return opt2; 
}

export function sunlightFactor() {
    // Calculate sunlightFactor using a sine wave
    let currentTime = new Date();
    let seconds = currentTime.getSeconds() + (60 * currentTime.getMinutes()); // Total seconds since the hour began
    let sunlightFactor = 0.33 + 0.67 * (1 + Math.sin(2 * Math.PI * seconds / 84)); // Sine varies from -1 to 1, so adjust it to vary from 0 to 1

    return sunlightFactor;
}

export function forceIntoRange(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

export function randomSelect(optionsArray) {
    return optionsArray[Math.floor(Math.random() * optionsArray.length)];
}