import {Component} from 'react';

class DonoForm extends Component<{onSubmit: ((a: string) => any)}> {
    public state = {
        info: ""
    }

    public render() {
        return (
            <div>
                <p>Dono Form</p>
                <input
                    type="text"
                    value={this.state.info}
                    onChange={e => this.setState({info: e.target.value})}/>
                <button onClick={() => this.props.onSubmit(this.state.info)}>Submit</button>
            </div>
        )
    }
}

export default DonoForm;
