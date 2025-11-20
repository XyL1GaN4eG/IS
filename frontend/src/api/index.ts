/* tslint:disable */
/* eslint-disable */
import { Configuration, DefaultConfig } from './runtime';
import { API_BASE } from '../lib/apiBase';
import { USER_HEADERS } from '../lib/userHeaders';

DefaultConfig.config = new Configuration({
    basePath: API_BASE,
    credentials: 'include',
    headers: USER_HEADERS,
});

export * from './runtime';
export * from './apis/index';
export * from './models/index';
