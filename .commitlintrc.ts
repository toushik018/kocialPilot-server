import type { UserConfig } from '@commitlint/types';

const commitConfig: UserConfig = {
  extends: ['@commitlint/config-conventional'],
};

module.exports = commitConfig;
