/* tslint:disable */
/* eslint-disable */
import { Configuration, DefaultConfig } from './runtime';
import { API_BASE } from '../lib/apiBase';

DefaultConfig.config = new Configuration({
    basePath: API_BASE,
    credentials: 'include',
});

export * from './runtime';
export * from './apis/index';
export * from './models/index';
