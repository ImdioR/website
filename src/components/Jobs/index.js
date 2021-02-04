import React from "react";
import { StaticQuery, graphql } from "gatsby";
import { Button } from "grommet";

const Jobs = () => (
  <StaticQuery
    query={graphql`
      query JobsQuery {
        allLambdaLever(filter: { position: { ne: "String" } }) {
          totalCount
          edges {
            node {
              id
              position
              link
            }
          }
        }
      }
    `}
    render={data => {
      const jobs = data.allLambdaLever.edges;

      if (jobs.length > 0) {
        return (
          <>
            {jobs.map((job, index) => {
              job = job.node;

              return (
                <div key={index}>
                  <p>
                    <Button
                      plain
                      rel="noopener noreferrer"
                      target="_blank"
                      href={job.link}
                    >
                      {job.position}
                    </Button>
                  </p>
                </div>
              );
            })}
          </>
        );
      }

      return (
        <>
          <p>There are no open positions at this time.</p>
        </>
      );
    }}
  />
);

export default Jobs;
