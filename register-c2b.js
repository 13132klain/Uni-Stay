"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!((t = (t = _.trys).length > 0 && t[t.length - 1]) || (op[0] === 6 || op[0] === 2))) {
                        _ = 0; continue;
                    }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};

var node_fetch_1 = require("node-fetch");

// Load environment variables
require('dotenv').config();

// Get credentials from environment variables
var consumerKey = process.env.MPESA_CONSUMER_KEY;
var consumerSecret = process.env.MPESA_CONSUMER_SECRET;
var shortcode = process.env.MPESA_SHORTCODE;
var baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.unistay.co.ke';

// Validate required environment variables
function validateEnvironment() {
    var missingVars = [];
    if (!consumerKey) missingVars.push('MPESA_CONSUMER_KEY');
    if (!consumerSecret) missingVars.push('MPESA_CONSUMER_SECRET');
    if (!shortcode) missingVars.push('MPESA_SHORTCODE');
    
    if (missingVars.length > 0) {
        console.error('Missing required environment variables:', missingVars.join(', '));
        console.error('Please create a .env file with the required variables.');
        process.exit(1);
    }
}

var confirmationURL = baseUrl + '/api/mpesa-c2b-callback';
var validationURL = baseUrl + '/api/mpesa-c2b-callback';

console.log('M-Pesa C2B Registration Configuration:');
console.log('Consumer Key:', consumerKey ? '***' + consumerKey.slice(-4) : 'NOT SET');
console.log('Shortcode:', shortcode);
console.log('Confirmation URL:', confirmationURL);
console.log('Validation URL:', validationURL);
console.log('');

var base64Credentials = Buffer.from("".concat(consumerKey, ":").concat(consumerSecret)).toString('base64');

function getAccessToken() {
    return __awaiter(this, void 0, void 0, function () {
        var response, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Getting access token...');
                    // Use sandbox API for testing
                    var apiUrl = process.env.NODE_ENV === 'production'
                        ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
                        : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
                    return [4 /*yield*/, (0, node_fetch_1.default)(apiUrl, {
                            headers: {
                                Authorization: "Basic ".concat(base64Credentials),
                            },
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Failed to get access token: ".concat(response.status, " ").concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    if (!data.access_token) {
                        throw new Error('Access token not found in response');
                    }
                    console.log('Access token obtained successfully');
                    return [2 /*return*/, data.access_token];
            }
        });
    });
}

function registerC2BUrls() {
    return __awaiter(this, void 0, void 0, function () {
        var accessToken, payload, response, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    validateEnvironment();
                    return [4 /*yield*/, getAccessToken()];
                case 1:
                    accessToken = _a.sent();
                    payload = {
                        ShortCode: shortcode,
                        ResponseType: 'Completed',
                        ConfirmationURL: confirmationURL,
                        ValidationURL: validationURL,
                    };
                    console.log('Registering C2B URLs...');
                    console.log('Payload:', JSON.stringify(payload, null, 2));
                    // Use sandbox API for testing
                    var c2bUrl = process.env.NODE_ENV === 'production'
                        ? 'https://api.safaricom.co.ke/mpesa/c2b/v1/registerurl'
                        : 'https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl';
                    return [4 /*yield*/, (0, node_fetch_1.default)(c2bUrl, {
                            method: 'POST',
                            headers: {
                                Authorization: "Bearer ".concat(accessToken),
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(payload),
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        var errorText = response.text();
                        throw new Error("C2B registration failed: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    console.log('C2B Registration Response:', JSON.stringify(data, null, 2));
                    
                    if (data.ResponseCode === '0') {
                        console.log('✅ C2B URLs registered successfully!');
                        console.log('Shortcode:', data.ShortCode);
                        console.log('Confirmation URL:', confirmationURL);
                        console.log('Validation URL:', validationURL);
                    } else {
                        console.error('❌ C2B registration failed:', data.ResponseDescription || 'Unknown error');
                    }
                    return [2 /*return*/];
            }
        });
    });
}

registerC2BUrls().catch(function (error) {
    console.error('❌ C2B registration failed:', error.message);
    process.exit(1);
});
