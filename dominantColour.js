let fs = require("fs");
let decode = require("image-decode");
let _ = require("underscore");

// Handle individual clusters of pixels.
class Cluster {
	constructor() {
		this.pixels = [];
		this.centroid = null;
		this.addPoint = function (pixel) {
			this.pixels.push(pixel);
		};
	}

	calculateCentroid() {
		// Collect all R, G, B values into their own arrays.
		let R = [];
		let G = [];
		let B = [];

		this.pixels.forEach((pixel) => R.push(pixel[0]));
		this.pixels.forEach((pixel) => G.push(pixel[1]));
		this.pixels.forEach((pixel) => B.push(pixel[2]));

		// Calculate average R, G, B values from the given pixel data.
		R = R.reduce((a, b) => a + b, 0) / R.length;
		G = G.reduce((a, b) => a + b, 0) / G.length;
		B = B.reduce((a, b) => a + b, 0) / B.length;

		this.centroid = [R, G, B];
		this.pixels = [];

		return this.centroid;
	}
}

// The kMeans algorithm to approximate the dominant colours.
class kMeans {
	constructor(k = 1, maxIterations = 3) {
		this.k = k;
		this.maxIterations = maxIterations;
	}

	assignCluster(clusters, pixel) {
		let shortestDist = Infinity;
		let nearestCluster;

		clusters.forEach((cluster) => {
			// console.log(cluster.centroid, pixel);
			let distance = this.calculateDistance(cluster.centroid, pixel);
			if (distance < shortestDist) {
				shortestDist = distance;
				nearestCluster = cluster;
			}
		});

		nearestCluster.pixels.push(pixel);
	}

	calculateDistance(a, b) {
		let dx = a[0] - b[0];
		let dy = a[1] - b[1];
		let dz = a[2] - b[2];

		return Math.sqrt(dx * dx + dy * dy + dz * dz);
	}

	run(image) {
		this.image = image;

		// Gather pixel data from image...
		// console.log("Reading image data...");
		this.pixels = decode(fs.readFileSync(this.image));
		// ...then format it properly.
		this.pixels = formatPixelData(this.pixels);

		// Initialise this.clusters as empty with length k.
		this.clusters = [this.k];

		// Randomly select k pixels from the pixel data as our starting centroid coordinates.
		this.randomCentroids = _.sample(this.pixels, this.k);

		for (let i = 0; i < this.k; i++) {
			this.clusters[i] = new Cluster();
			this.clusters[i].centroid = this.randomCentroids[i];
		}

		let iterations = 0;
		while (iterations < this.maxIterations) {
			// Iterate through each pixel and assign it to a cluster.
			// It is assigned to the cluster with the closest centroid.
			this.pixels.forEach((pixel) => {
				this.assignCluster(this.clusters, pixel);
			});

			// Calculate the new centroid for each cluster.
			this.clusters.forEach((cluster) => {
				cluster.calculateCentroid();
			});

			iterations++;
		}

		this.dominantColours = this.clusters.map((cluster) => cluster.centroid);

		this.dominantColours.forEach((colour) => {
			for (let i = 0; i < colour.length; i++) {
				colour[i] = Math.round(colour[i]);
			}
		});

		return this.dominantColours;
	}
}

// Converts the pixel data returned by "decode-image" from Uint8Array to a 2D array: [[r,g,b], [r,g,b] ...]
function formatPixelData(pixels) {
	let output = [];
	let pixelData = Array.from(pixels.data);

	for (let i = 0; i < pixelData.length; i = i + 4) {
		output.push(pixelData.slice(i, i + 3));
	}

	return output;
}

kMeans = new kMeans(5, 10);
console.log(kMeans.run("./festival.jpg"));
