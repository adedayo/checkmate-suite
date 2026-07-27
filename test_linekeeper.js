let EOLLocations = [];

function appendEOLs(eols) {
    let sorted = [...eols].sort((a, b) => a - b);
    if (EOLLocations.length > 0) {
        let last = EOLLocations[EOLLocations.length - 1];
        for (let i = 0; i < sorted.length; i++) {
            sorted[i] += last + 1;
        }
    }
    EOLLocations = EOLLocations.concat(sorted);
}

function GetPositionFromCharacterIndex(pos) {
    if (EOLLocations.length > 0) {
        let end = EOLLocations.length - 1;
        if (pos > EOLLocations[end]) {
            return {
                Line: end + 1,
                Character: pos - EOLLocations[end] - 1
            };
        }
        for (let i = 0; i < EOLLocations.length; i++) {
            let eol = EOLLocations[i];
            if (eol >= pos) {
                if (i > 0) {
                    return {
                        Line: i,
                        Character: pos - EOLLocations[i-1] - 1
                    };
                }
                break;
            }
        }
    }
    return {
        Line: 0,
        Character: pos
    };
}

// 0123 4567 890
// abc\ndef\nghi
appendEOLs([3]);
appendEOLs([3]);

console.log("EOLs:", EOLLocations);
const tests = [0, 3, 4, 5, 7, 8, 9];
for (let pos of tests) {
    console.log(`pos ${pos}:`, GetPositionFromCharacterIndex(pos));
}
