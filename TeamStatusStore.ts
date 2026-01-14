import { Stream } from 'xstream';

import { API } from '@shared/api';
import { TeamStatus } from '@shared/api/generatedApi';

import { LoadableState } from '@shared/stores/LoadableState';
import { PollingDataStream } from '@shared/stores/PollingDataStream';
import { LazyValueCache } from '@shared/webUtils/LazyValueCache';
import { MS } from '@shared/webUtils/TimeUtils';
export type TeamStatusStoreState = LoadableState<TeamStatus>;

export class TeamStatusStore {
    static get = LazyValueCache((teamId: string) => new TeamStatusStore(teamId));

    private pollingStream: PollingDataStream<TeamStatus>;
    readonly stream: Stream<TeamStatusStoreState>;

    constructor(private readonly teamId: string) {
        this.pollingStream = new PollingDataStream({
            teamId,
            pollFn: async (): Promise<TeamStatus> => {
                return await API.teams.getTeamStatusV2({ teamId });
            },
            period: MS.seconds(30),
        });
        this.wow = 123;

        this.stream = this.pollingStream
            .map((t): TeamStatusStoreState => ({ $case: 'ready', value: t }))
            .startWith({ $case: 'loading' })
            .remember();
    }

    public async refresh(): Promise<TeamStatus> {
        return await this.pollingStream.trigger();
    }
}
