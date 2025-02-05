// // controllers/sessionController.js
// import { sendCitySelection, sendOrderSummary, sendUpdatedSummary } from './messageController';
// import sessionModel from '../models/sessionModel';

// export const startSession = (req, res) => {
//     const { sessionId } = req.body;
//     sessionModel.createSession(sessionId);
//     sendCitySelection(sessionId);
//     res.status(200).send({ message: "Session started" });
// };

// export const updateSessionData = (req, res) => {
//     const { sessionId, key, value } = req.body;
//     sessionModel.updateSession(sessionId, key, value);
    
//     if (key === 'city') {
//         sendOrderSummary(sessionId);
//     }

//     res.status(200).send({ message: "Session updated" });
// };

// export const getSession = (req, res) => {
//     const { sessionId } = req.params;
//     const session = sessionModel.getSession(sessionId);
//     res.status(200).json(session);
// };
