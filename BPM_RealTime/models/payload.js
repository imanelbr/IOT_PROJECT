class Payload {
    constructor(bpm, long, latt, alt) {
        this.bpm = bpm;
        this.long = long;
        this.latt = latt;
        this.alt = alt;
    }

    toDict() {
        return {
            "bpm": this.bpm,
            "long": this.long,
            "latt": this.latt,
            "alt": this.alt
        }
    }
}

module.exports = Payload;