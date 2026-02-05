/**
 * Apollo Client Provider with Dynamic Endpoint
 * 
 * Creates an Apollo Client that uses the endpoint from LineraContext.
 * The client is recreated when the endpoint changes.
 */

import React, { useMemo, ReactNode } from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink } from '@apollo/client';
import { useLinera } from '@/hooks/useLinera';

interface DynamicApolloProviderProps {
    children: ReactNode;
    /** Fallback endpoint when not connected to Linera */
    fallbackEndpoint?: string;
}

/**
 * Apollo Provider that dynamically updates based on Linera connection state.
 * Must be used inside LineraProvider.
 */
export function DynamicApolloProvider({
    children,
    fallbackEndpoint = 'http://localhost:8080/graphql'
}: DynamicApolloProviderProps) {
    const { graphqlEndpoint, isConnected } = useLinera();

    // Create Apollo Client with current endpoint
    const client = useMemo(() => {
        const endpoint = (isConnected && graphqlEndpoint) || fallbackEndpoint;

        console.log('[Apollo] Creating client with endpoint:', endpoint);

        return new ApolloClient({
            link: new HttpLink({
                uri: endpoint,
                // Include credentials for cross-origin requests if needed
                credentials: 'same-origin',
            }),
            cache: new InMemoryCache(),
            // Clear cache when endpoint changes
            defaultOptions: {
                watchQuery: {
                    fetchPolicy: 'network-only',
                },
                query: {
                    fetchPolicy: 'network-only',
                },
            },
        });
    }, [graphqlEndpoint, isConnected, fallbackEndpoint]);

    return (
        <ApolloProvider client={client}>
            {children}
        </ApolloProvider>
    );
}

export default DynamicApolloProvider;
