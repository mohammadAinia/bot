const userSessions = {};

const STATES = {
    WELCOME: 0,
    FAQ: "faq",
    NAME: 1,
    PHONE_CONFIRM: "phone_confirm",
    PHONE_INPUT: "phone_input",
    EMAIL: 3,
    ADDRESS: 4,
    CITY: 7,
    STREET: 9,
    BUILDING_NAME: 10,
    FLAT_NO: 11,
    LATITUDE: 12,
    LONGITUDE: 13,
    QUANTITY: 6,
    CONFIRMATION: 5,
    MODIFY: "modify"
};

const getSession = (userId) => userSessions[userId];
const createSession = (userId) => {
    userSessions[userId] = { step: STATES.WELCOME, data: {} };
    return userSessions[userId];
};
const deleteSession = (userId) => delete userSessions[userId];

export { getSession, createSession, deleteSession, STATES };