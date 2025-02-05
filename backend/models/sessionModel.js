// // models/sessionModel.js
// class SessionModel {
//     constructor() {
//         this.dataStore = [];
//         this.userSessions = {};
//     }

//     createSession(sessionId) {
//         if (!this.userSessions[sessionId]) {
//             this.userSessions[sessionId] = {
//                 state: STATES.WELCOME,
//                 data: {}
//             };
//         }
//     }

//     updateSession(sessionId, key, value) {
//         if (this.userSessions[sessionId]) {
//             this.userSessions[sessionId].data[key] = value;
//         }
//     }

//     getSession(sessionId) {
//         return this.userSessions[sessionId];
//     }

//     getAllSessions() {
//         return this.userSessions;
//     }
// }

// export default new SessionModel();
